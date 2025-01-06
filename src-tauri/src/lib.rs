use std::{
    arch::x86_64::_mm_fnmsub_sd,
    io::Write,
    net::{IpAddr, Ipv4Addr, SocketAddr, SocketAddrV4, TcpStream, UdpSocket},
    str::FromStr,
    sync::Mutex,
};

use anyhow::{anyhow, Context};
use log::info;
use tauri::{Emitter, Manager, Result};
use tauri_plugin_log::{fern::colors::ColoredLevelConfig, Target, TargetKind};
use tauri_plugin_store::StoreExt;

const SENSOR_TCP_PORT: u16 = 12345;
const STORE_PATH: &str = "store.json";

#[derive(Default)]
struct AppState {
    sensor_tcp: Option<TcpStream>,
    listen_udp_port: Option<u16>,
}

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
struct SensorStatus {
    version: [u8; 3],
    connected: bool,
    display_ok: bool,
    haptic_ok: bool,
    heart_ok: bool,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }))
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir {
                        file_name: Some("esp-pulser-gui".to_owned()),
                    }),
                    Target::new(TargetKind::Webview),
                ])
                .level(log::LevelFilter::Info)
                .max_file_size(50_000 /* bytes */)
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                .with_colors(ColoredLevelConfig::default())
                .build(),
        )
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;

            app.store(STORE_PATH)?;

            app.manage(Mutex::new(AppState::default()));
            let app_handle = app.app_handle().clone();
            tauri::async_runtime::spawn(async move {
                loop {
                    match sensor_thread(&app_handle) {
                        Ok(_) => {}
                        Err(e) => log::error!("Error in UDP listener thread: {:?}", e),
                    }
                }
            });
            let app_handle = app.app_handle().clone();
            tauri::async_runtime::spawn(async move {
                loop {
                    match connect_sensor(&app_handle) {
                        Ok(_) => {}
                        Err(e) => log::error!("Error in sensor connection thread: {:?}", e),
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn connect_sensor(app_handle: &tauri::AppHandle) -> Result<()> {
    let state = app_handle.state::<Mutex<AppState>>();

    let store = app_handle
        .get_store(STORE_PATH)
        .context("Store unavailable")?;

    loop {
        info!("Attempting sensor connection");
        let udp_port = {
            state
                .lock()
                .unwrap()
                .listen_udp_port
                .context("Listener UDP port is not yet ready")?
        };

        let sensor_ip = Ipv4Addr::from_str(
            serde_json::from_value::<String>(
                store
                    .get("sensor_ip_address")
                    .context("IP address not set")?,
            )?
            .as_str(),
        )
        .map_err(|e| anyhow!(e))?;

        info!(
            "Attempting TCP connection to {}:{}",
            sensor_ip, SENSOR_TCP_PORT
        );

        let mut sensor_tcp = TcpStream::connect_timeout(
            &SocketAddr::new(IpAddr::V4(sensor_ip), SENSOR_TCP_PORT),
            std::time::Duration::from_secs(1),
        )?;
        sensor_tcp.set_nonblocking(true)?;

        info!(
            "Connection established, sending UDP heartbeat listener port: {}",
            udp_port
        );

        sensor_tcp.write(&udp_port.to_be_bytes())?;
        {
            state.lock().unwrap().sensor_tcp = Some(sensor_tcp);
        }

        loop {
            if state.lock().unwrap().sensor_tcp.is_none() {
                break;
            } else {
                std::thread::sleep(std::time::Duration::from_millis(100));
            }
        }

        log::warn!("Restarting TCP connection");
    }
}

fn sensor_thread(app_handle: &tauri::AppHandle) -> Result<()> {
    let socket = UdpSocket::bind(SocketAddrV4::new(Ipv4Addr::new(0, 0, 0, 0), 0))?;
    socket.set_nonblocking(true)?;
    info!("listening on {:?}", socket.local_addr()?);

    {
        let state = app_handle.state::<Mutex<AppState>>();
        let mut state = state.lock().unwrap();
        state.listen_udp_port = Some(socket.local_addr()?.port());
    }

    let mut buf = [0u8; 1024];
    let mut last_heartbeat = std::time::Instant::now();

    loop {
        let now = std::time::Instant::now();
        match socket.recv_from(&mut buf) {
            Ok((n, _)) => {
                last_heartbeat = std::time::Instant::now();
                app_handle.emit("connection", true)?;
                if n == 204 {
                    for i in 0..n / 2 {
                        let value = u16::from_be_bytes([buf[i * 2], buf[i * 2 + 1]]);
                        app_handle.emit(
                            if i == 0 {
                                "bpm_datum"
                            } else if i == 1 {
                                "ibi_datum"
                            } else {
                                "heartbeat_datum"
                            },
                            value,
                        )?;
                    }
                } else if let Ok(status) = bincode::deserialize::<SensorStatus>(&buf[..n]) {
                    app_handle.emit("sensor_status", status)?;
                }
            }
            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {}
            Err(e) => {
                log::error!("Error reading from UDP socket: {:?}", e);
                break;
            }
        }
        if now.duration_since(last_heartbeat) > std::time::Duration::from_secs(1) {
            log::error!("No heartbeat received from sensor, restarting connection");
            app_handle.emit("connection", false)?;
            break;
        }
    }
    {
        let state = app_handle.state::<Mutex<AppState>>();
        let mut state = state.lock().unwrap();
        state.sensor_tcp = None;
    }
    Ok(())
}
