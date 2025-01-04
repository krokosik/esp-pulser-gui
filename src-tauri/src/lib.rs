use std::{
    io::Write,
    net::{Ipv4Addr, SocketAddrV4, TcpStream, UdpSocket},
    sync::Mutex,
    thread::sleep,
    time::Duration,
};

use anyhow::{anyhow, Context};
use libarp::{client::ArpClient, interfaces::MacAddr};
use log::info;
use tauri::{Emitter, Manager, Result};
use tauri_plugin_log::{fern::colors::ColoredLevelConfig, Target, TargetKind};

const SENSOR_MAC_ADDRESS: [u8; 6] = [0x30, 0xae, 0xa4, 0x0c, 0x1b, 0x4c];
const SENSOR_TCP_PORT: u16 = 12345;

#[derive(Default)]
struct AppState {
    sensor_tcp: Option<TcpStream>,
    udp_port: Option<u16>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![connect_sensor])
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
        .setup(|app| {
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;

            app.manage(Mutex::new(AppState::default()));
            let app_handle = app.app_handle().clone();
            tauri::async_runtime::spawn(async move {
                sensor_thread(&app_handle).expect("error while running sensor thread");
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn connect_sensor(state: tauri::State<'_, Mutex<AppState>>) -> Result<()> {
    let mut app_state = state.lock().unwrap();
    let mut client = ArpClient::new()?;

    if app_state.sensor_tcp.is_none() {
        let udp_port = app_state
            .udp_port
            .context("Listener UDP port is not yet ready")?;

        let sensor_ip = client.mac_to_ip(
            MacAddr::new(
                SENSOR_MAC_ADDRESS[0],
                SENSOR_MAC_ADDRESS[1],
                SENSOR_MAC_ADDRESS[2],
                SENSOR_MAC_ADDRESS[3],
                SENSOR_MAC_ADDRESS[4],
                SENSOR_MAC_ADDRESS[5],
            ),
            Some(Duration::from_secs(2)),
        )?;
        let mut sensor_tcp =
            TcpStream::connect(&SocketAddrV4::new(sensor_ip, SENSOR_TCP_PORT))?;
        sensor_tcp.write(&udp_port.to_be_bytes())?;
        app_state.sensor_tcp = Some(sensor_tcp);
    }

    Ok(())
}

fn sensor_thread(app_handle: &tauri::AppHandle) -> Result<()> {
    let socket = UdpSocket::bind(SocketAddrV4::new(Ipv4Addr::new(0, 0, 0, 0), 0))?;
    info!("listening on {:?}", socket.local_addr()?);
    let mut buf = [0u8; 100];
    loop {
        let (n, _src) = socket.recv_from(&mut buf)?;
        if n == 2 {
            app_handle.emit("heartbeat_datum", u16::from_be_bytes([buf[0], buf[1]]))?;
        }
    }
}
