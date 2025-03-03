use std::{
    io::{BufRead, BufReader, Write},
    net::{IpAddr, Ipv4Addr, SocketAddr, SocketAddrV4, TcpStream, UdpSocket},
    str::FromStr,
    sync::{Arc, Mutex},
};

use anyhow::{anyhow, Context};
use log::info;
use tauri::{Emitter, Listener, Manager, Result};
use tauri_plugin_log::{fern::colors::ColoredLevelConfig, Target, TargetKind};
use tauri_plugin_store::StoreExt;

const SENSOR_TCP_PORT: u16 = 12345;
const STORE_PATH: &str = "store.json";

#[derive(Default)]
struct AppState {
    sensor_tcp: Option<TcpStream>,
    td_udp: Option<Arc<UdpSocket>>,
    listen_udp_port: Option<u16>,
    emit_dummy: bool,
}

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
struct SensorStatus {
    version: [u8; 3],
    connected: bool,
    display_ok: bool,
    haptic_ok: bool,
    heart_ok: bool,
    led_amplitude: u8,
}

#[derive(Debug, serde::Deserialize, serde::Serialize)]
enum Packet {
    Status(SensorStatus),
    RawHeartRate(f32),
    Bpm(f32),
    HeartRate(f32),
    // Debug((f32, f32, f32)),
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
        .invoke_handler(tauri::generate_handler![
            sensor_command,
            change_td_port,
            set_dummy_data,
            change_led_amplitude
        ])
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
                        Err(e) => {
                            log::error!("Error in UDP listener thread: {:?}", e);
                            std::thread::sleep(std::time::Duration::from_secs(1));
                        }
                    }
                }
            });
            let app_handle = app.app_handle().clone();
            tauri::async_runtime::spawn(async move {
                let mut error_count = 0;
                loop {
                    match connect_sensor(&app_handle, &mut error_count) {
                        Ok(_) => {}
                        Err(e) => {
                            error_count += 1;
                            if error_count < 5 {
                                log::error!("Error in sensor connection thread: {:?}", e);
                            }
                            std::thread::sleep(std::time::Duration::from_secs(1));
                        }
                    }
                }
            });

            let app_handle = app.app_handle().clone();
            tauri::async_runtime::spawn(async move {
                loop {
                    match touch_designer_thread(&app_handle) {
                        Ok(_) => {}
                        Err(e) => {
                            log::error!("Error in TouchDesigner thread: {:?}", e);
                            std::thread::sleep(std::time::Duration::from_secs(1));
                        }
                    }
                }
            });

            let app_handle = app.app_handle().clone();
            tauri::async_runtime::spawn(async move {
                loop {
                    match dummy_data_thread(&app_handle) {
                        Ok(_) => {}
                        Err(e) => {
                            log::error!("Error in dummy data thread: {:?}", e);
                            std::thread::sleep(std::time::Duration::from_secs(1));
                        }
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn dummy_data_thread(app_handle: &tauri::AppHandle) -> Result<()> {
    let state = app_handle.state::<Mutex<AppState>>();
    let hb_data_path = app_handle.path().resolve("heartbeat_data.dat", tauri::path::BaseDirectory::Resource)?;

    loop {
        let file = std::fs::File::open(hb_data_path.clone())?;
        let bufread = BufReader::new(&file);

        {
            while !state.lock().unwrap().emit_dummy {
                std::thread::sleep(std::time::Duration::from_secs(1));
            }
        }

        log::info!("Sending dummy data");

        for line in bufread.lines() {
            if !state.lock().unwrap().emit_dummy {
                break;
            }
            let line = line?;
            let [raw, processed, bpm, ibi] = line
                .split_whitespace()
                .map(|s| s.parse::<f32>().unwrap_or_default())
                .collect::<Vec<f32>>()
                .try_into()
                .unwrap_or_default();
            app_handle.emit("raw_heartbeat_datum", raw)?;
            app_handle.emit("heartbeat_datum", processed)?;
            app_handle.emit("bpm_datum", bpm)?;
            app_handle.emit("ibi_datum", ibi)?;
            std::thread::sleep(std::time::Duration::from_millis(40));
        }
    }
}

fn connect_sensor(app_handle: &tauri::AppHandle, error_count: &mut u8) -> Result<()> {
    let state = app_handle.state::<Mutex<AppState>>();

    let store = app_handle
        .get_store(STORE_PATH)
        .context("Store unavailable")?;

    loop {
        log::debug!("Attempting sensor connection");
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

        log::debug!(
            "Attempting TCP connection to {}:{}",
            sensor_ip,
            SENSOR_TCP_PORT
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

        let mut buffer = [0u8; 3];
        buffer[0] = 3;
        buffer[1] = udp_port.to_be_bytes()[0];
        buffer[2] = udp_port.to_be_bytes()[1];
        sensor_tcp.write(&buffer)?;
        {
            state.lock().unwrap().sensor_tcp = Some(sensor_tcp);
        }

        *error_count = 0;

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

fn touch_designer_thread(app_handle: &tauri::AppHandle) -> Result<()> {
    let state = app_handle.state::<Mutex<AppState>>();

    let socket = UdpSocket::bind(SocketAddrV4::new(Ipv4Addr::new(0, 0, 0, 0), 0))?;
    let socket = Arc::new(socket);
    {
        let mut state = state.lock().unwrap();
        state.td_udp = Some(socket.clone());
    }

    let store = app_handle
        .get_store(STORE_PATH)
        .context("Store unavailable")?;

    let td_port = serde_json::from_value::<u16>(
        store
            .get("td_udp_port")
            .context("TouchDesigner port not set")?,
    )?;
    socket.connect(SocketAddrV4::new(Ipv4Addr::new(127, 0, 0, 1), td_port))?;

    let heartbeat_addr = "/heartbeat_signal".to_string();

    {
        let socket = socket.clone();
        app_handle.listen("heartbeat_datum", move |event| {
            let buf = rosc::encoder::encode(&rosc::OscPacket::Message(rosc::OscMessage {
                addr: heartbeat_addr.clone(),
                args: vec![rosc::OscType::Float(
                    event.payload().parse().unwrap_or_default(),
                )],
            }))
            .unwrap();

            match socket.send(&buf) {
                Ok(_) => {}
                Err(e) => {
                    log::error!("Error sending to TouchDesigner: {:?}", e);
                }
            }
        });
    }

    let bpm_addr = "/bpm".to_string();

    {
        let socket = socket.clone();
        app_handle.listen("bpm_datum", move |event| {
            let buf = rosc::encoder::encode(&rosc::OscPacket::Message(rosc::OscMessage {
                addr: bpm_addr.clone(),
                args: vec![rosc::OscType::Float(
                    event.payload().parse().unwrap_or_default(),
                )],
            }))
            .unwrap();

            match socket.send(&buf) {
                Ok(_) => {}
                Err(e) => {
                    log::error!("Error sending to TouchDesigner: {:?}", e);
                }
            }
        });
    }

    let ibi_addr = "/ibi".to_string();

    {
        let socket = socket.clone();
        app_handle.listen("ibi_datum", move |event| {
            let buf = rosc::encoder::encode(&rosc::OscPacket::Message(rosc::OscMessage {
                addr: ibi_addr.clone(),
                args: vec![rosc::OscType::Float(
                    event.payload().parse().unwrap_or_default(),
                )],
            }))
            .unwrap();

            match socket.send(&buf) {
                Ok(_) => {}
                Err(e) => {
                    log::error!("Error sending to TouchDesigner: {:?}", e);
                }
            }
        });
    }

    loop {
        std::thread::sleep(std::time::Duration::from_secs(10));
    }
}

fn sensor_thread(app_handle: &tauri::AppHandle) -> Result<()> {
    let state = app_handle.state::<Mutex<AppState>>();
    let socket = UdpSocket::bind(SocketAddrV4::new(Ipv4Addr::new(0, 0, 0, 0), 0))?;
    socket.set_nonblocking(true)?;
    info!("listening on {:?}", socket.local_addr()?);

    {
        let mut state = state.lock().unwrap();
        state.listen_udp_port = Some(socket.local_addr()?.port());
    }

    // let mut file = std::fs::OpenOptions::new()
    //     .append(true)
    //     .create(true)
    //     .open("heartbeat_data.dat")?;

    loop {
        if state.lock().unwrap().sensor_tcp.is_none() {
            std::thread::sleep(std::time::Duration::from_secs(1));
        } else {
            break;
        }
    }

    let mut buf = [0u8; 1024];
    let mut last_heartbeat = std::time::Instant::now();
    app_handle.emit("connection", true)?;

    loop {
        let now = std::time::Instant::now();
        match socket.recv_from(&mut buf) {
            Ok((n, _)) => {
                last_heartbeat = std::time::Instant::now();
                app_handle.emit("connection", true)?;

                match bincode::deserialize::<Packet>(&buf[..n]) {
                    Ok(Packet::Status(status)) => {
                        app_handle.emit("sensor_status", status)?;
                    }
                    Ok(Packet::RawHeartRate(value)) => {
                        app_handle.emit("raw_heartbeat_datum", value)?;
                    }
                    Ok(Packet::Bpm(value)) => {
                        app_handle.emit("bpm_datum", value)?;
                        app_handle.emit("ibi_datum", 60000.0 / value)?;
                    }
                    Ok(Packet::HeartRate(value)) => {
                        app_handle.emit("heartbeat_datum", value)?;
                    }
                    // Ok(Packet::Debug((raw, processed, bpm))) => {
                    //     writeln!(file, "{} {} {} {}", raw, processed, bpm, 60000.0 / bpm)?;
                    //     app_handle.emit("raw_heartbeat_datum", raw)?;
                    //     app_handle.emit("heartbeat_datum", processed)?;
                    //     app_handle.emit("bpm_datum", bpm)?;
                    //     app_handle.emit("ibi_datum", 60000.0 / bpm)?;
                    // }
                    Err(e) => {
                        log::warn!("Error deserializing packet: {:?}", e);
                    }
                }
            }
            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {}
            Err(e) => {
                log::error!("Error reading from UDP socket: {:?}", e);
                break;
            }
        }
        if now.duration_since(last_heartbeat) > std::time::Duration::from_secs(10) {
            log::error!("No heartbeat received from sensor, restarting connection");
            app_handle.emit("connection", false)?;
            break;
        }
        std::thread::sleep(std::time::Duration::from_millis(1));
    }
    {
        let state = app_handle.state::<Mutex<AppState>>();
        let mut state = state.lock().unwrap();
        state.sensor_tcp = None;
    }
    Ok(())
}

#[tauri::command]
fn sensor_command(command: u8, data: String, app_handle: tauri::AppHandle) -> Result<()> {
    let state = app_handle.state::<Mutex<AppState>>();
    let mut state = state.lock().unwrap();
    let mut buffer = vec![command];
    buffer.extend_from_slice(data.as_bytes());
    if let Some(sensor_tcp) = &mut state.sensor_tcp {
        sensor_tcp.write(&buffer)?;
    }
    Ok(())
}

#[tauri::command]
fn change_td_port(port: u16, app_handle: tauri::AppHandle) -> Result<()> {
    let state = app_handle.state::<Mutex<AppState>>();
    let mut state = state.lock().unwrap();
    log::info!("Changing TD port to {}", port);
    if let Some(socket) = &mut state.td_udp {
        socket.connect(SocketAddrV4::new(Ipv4Addr::new(127, 0, 0, 1), port))?;
    }
    Ok(())
}

#[tauri::command]
fn set_dummy_data(emit_dummy: bool, app_handle: tauri::AppHandle) -> Result<()> {
    let state = app_handle.state::<Mutex<AppState>>();
    let mut state = state.lock().unwrap();
    state.emit_dummy = emit_dummy;
    Ok(())
}

#[tauri::command]
fn change_led_amplitude(amplitude: u8, app_handle: tauri::AppHandle) -> Result<()> {
    let state = app_handle.state::<Mutex<AppState>>();
    let mut state = state.lock().unwrap();
    let buffer = [2, amplitude];
    if let Some(sensor_tcp) = &mut state.sensor_tcp {
        sensor_tcp.write(&buffer)?;
    }
    Ok(())
}