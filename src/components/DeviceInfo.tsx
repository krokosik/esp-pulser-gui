import { Button, Icon } from "@blueprintjs/core";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect } from "react";
import { SensorStatus, useAppStore } from "../store";
import { check } from "@tauri-apps/plugin-updater";
import { error, info } from "@tauri-apps/plugin-log";
import { fetch } from "@tauri-apps/plugin-http";

const DeviceInfo: React.FC = () => {
  const {
    appVersion,
    connected,
    setConnected,
    sensorStatus,
    setSensorStatus,
    setGuiUpdateAvailable,
    setFirmwareVersionAvailable,
  } = useAppStore();

  useEffect(() => {
    const unlistenConnectionPromise = listen("connection", (event) => {
      const connected = event.payload as boolean;
      setConnected(connected);
    });
    const unlistenStatusPromise = listen("sensor_status", (event) => {
      const sensorStatus = event.payload as SensorStatus;
      setSensorStatus(sensorStatus);
    });

    checkUpdates(); // Check for updates on mount

    return () => {
      unlistenConnectionPromise.then((fn) => fn());
      unlistenStatusPromise.then((fn) => fn());
    };
  }, []);

  const checkUpdates = useCallback(async () => {
    const update = await check();
    if (update) {
      info(`GUI update available: ${update.version}`);
      setGuiUpdateAvailable(true);
    } else {
      info("No GUI updates available");
      setGuiUpdateAvailable(false);
    }

    try {
      const res = await fetch(
        "https://api.github.com/repos/krokosik/esp-pulser/releases/latest"
      );
      const data = await res.json();
      const firmwareVersion = data.tag_name.slice(1); // Remove the 'v' prefix
      info(`Found firmware version: ${firmwareVersion}`);
      setFirmwareVersionAvailable(firmwareVersion);
    } catch (e) {
      error(`Failed to fetch firmware version: ${e}`);
    }
  }, []);

  return (
    <div>
      <h2>
        <Icon icon="info-sign" /> Device Info
      </h2>
      <p>Firmware: v{sensorStatus?.version.join(".")}</p>
      <p>App Version: v{appVersion}</p>
      <p>
        Connected:{" "}
        <strong style={{ color: connected ? "green" : "red" }}>
          {connected ? "Yes" : "No"}
        </strong>
      </p>
      <Button icon="refresh" text="Check for Updates" onClick={checkUpdates} />
    </div>
  );
};

export default DeviceInfo;
