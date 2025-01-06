import { Button, Icon } from "@blueprintjs/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";
import { SensorStatus, useAppStore } from "../store";

const DeviceInfo: React.FC = () => {
  const { appVersion, connected, setConnected, sensorStatus, setSensorStatus } =
    useAppStore();

  useEffect(() => {
    const unlistenConnectionPromise = listen("connection", (event) => {
      const connected = event.payload as boolean;
      setConnected(connected);
    });
    const unlistenStatusPromise = listen("sensor_status", (event) => {
      const sensorStatus = event.payload as SensorStatus;
      setSensorStatus(sensorStatus);
    });

    return () => {
      unlistenConnectionPromise.then((fn) => fn());
      unlistenStatusPromise.then((fn) => fn());
    };
  }, [setConnected, setSensorStatus]);

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
      <Button icon="refresh" text="Check for Updates" />
    </div>
  );
};

export default DeviceInfo;
