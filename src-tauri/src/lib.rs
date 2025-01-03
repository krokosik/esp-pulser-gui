use std::net::{Ipv4Addr, SocketAddrV4, UdpSocket};

use anyhow::Result;
use log::info;
use tauri::{Emitter, Manager};
use tauri_plugin_log::{fern::colors::ColoredLevelConfig, Target, TargetKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
            let app_handle = app.app_handle().clone();
            #[cfg(desktop)]
            app_handle
                .plugin(tauri_plugin_updater::Builder::new().build())?;
            tauri::async_runtime::spawn(async move {
                sensor_thread(&app_handle).expect("error while running sensor thread");
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn sensor_thread(app_handle: &tauri::AppHandle) -> Result<()> {
    let socket = UdpSocket::bind(SocketAddrV4::new(Ipv4Addr::new(0, 0, 0, 0), 34254))?;
    info!("listening on {:?}", socket.local_addr()?);
    let mut buf = [0u8; 100];
    loop {
        let (n, _src) = socket.recv_from(&mut buf)?;
        if n == 2 {
            app_handle.emit("heartbeat_datum", u16::from_be_bytes([buf[0], buf[1]]))?;
        }
    }
}
