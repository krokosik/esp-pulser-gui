# ESP Pulser GUI

## Description

This desktop app is a companion to the [esp-pulser](https://github.com/krokosik/esp-pulser-gui). It can be used to view component status, update version and more, assuming it is connected to the same local network. It also is responsible to retransmitting the UDP heartbeat data from the sensor to TouchDesigner via OSC. Additionally, it allows viewing the heartbeat data and the collected logs (only from the app, not the sensor).

## Development

To work with the code, both Rust and NodeJS need to be set up. Clone the repo and run
```
npm run tauri dev
```
to start developing.
