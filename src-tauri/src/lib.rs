use std::{
    io::Write,
    net::{IpAddr, Ipv4Addr, SocketAddr, SocketAddrV4, TcpStream, UdpSocket},
    str::FromStr,
    sync::Mutex,
    time::Duration,
};

use anyhow::{anyhow, Context};
use log::info;
use tauri::{Emitter, Manager, Result};
use tauri_plugin_log::{fern::colors::ColoredLevelConfig, Target, TargetKind};

const SENSOR_TCP_PORT: u16 = 12345;

#[derive(Default)]
struct AppState {
    sensor_tcp: Option<TcpStream>,
    listen_udp_port: Option<u16>,
    sensor_ip: Option<Ipv4Addr>,
    td_udp_port: u16,
}

#[tauri::command]
fn get_sensor_ip(state: tauri::State<'_, Mutex<AppState>>) -> String {
    let state = state.lock().unwrap();
    state
        .sensor_ip
        .and_then(|ip| Some(ip.to_string()))
        .unwrap_or(String::from(""))
}

#[tauri::command]
fn set_sensor_ip(ip: String, state: tauri::State<'_, Mutex<AppState>>) -> Result<()> {
    let mut state = state.lock().unwrap();
    state.sensor_ip = Some(Ipv4Addr::from_str(&ip).map_err(|e| anyhow!(e))?);
    info!("Sensor IP set to {}", &ip);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            connect_sensor,
            get_sensor_ip,
            set_sensor_ip,
            get_td_udp_port,
            set_td_udp_port,
        ])
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
                loop {
                    match sensor_thread(&app_handle) {
                        Ok(_) => {}
                        Err(e) => log::error!("Error in UDP listener thread: {:?}", e),
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn connect_sensor(state: tauri::State<'_, Mutex<AppState>>) -> Result<()> {
    let mut state = state.lock().unwrap();

    if state.sensor_tcp.is_some() {
        info!("TCP Stream already exists");
        return Ok(());
    }

    info!("Attempting sensor connection");
    let udp_port = state
        .listen_udp_port
        .context("Listener UDP port is not yet ready")?;

    let sensor_ip = state.sensor_ip.context("IP address not set")?;

    info!(
        "Attempting TCP connection to {}:{}",
        sensor_ip, SENSOR_TCP_PORT
    );

    let mut sensor_tcp = TcpStream::connect_timeout(
        &SocketAddr::new(IpAddr::V4(sensor_ip), SENSOR_TCP_PORT),
        Duration::from_secs(5),
    )?;

    info!(
        "Connection established, sending UDP heartbeat listener port: {}",
        udp_port
    );

    sensor_tcp.write(&udp_port.to_be_bytes())?;
    state.sensor_tcp = Some(sensor_tcp);

    Ok(())
}

fn sensor_thread(app_handle: &tauri::AppHandle) -> Result<()> {
    let socket = UdpSocket::bind(SocketAddrV4::new(Ipv4Addr::new(0, 0, 0, 0), 0))?;
    info!("listening on {:?}", socket.local_addr()?);

    {
        let state = app_handle.state::<Mutex<AppState>>();
        let mut state = state.lock().unwrap();
        state.listen_udp_port = Some(socket.local_addr()?.port());
    }

    let mut buf = [0u8; 100];
    loop {
        let (n, _src) = socket.recv_from(&mut buf)?;
        if n == 2 {
            app_handle.emit("heartbeat_datum", u16::from_be_bytes([buf[0], buf[1]]))?;
        }
    }
}

#[tauri::command]
fn get_td_udp_port(state: tauri::State<'_, Mutex<AppState>>) -> u16 {
    let state = state.lock().unwrap();
    state.td_udp_port
}

#[tauri::command]
fn set_td_udp_port(port: u16, state: tauri::State<'_, Mutex<AppState>>) -> Result<()> {
    let mut state = state.lock().unwrap();
    state.td_udp_port = port;
    info!("TouchDesigner UDP port set to {}", &port);
    Ok(())
}
