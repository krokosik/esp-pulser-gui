import { Icon, Button } from "@blueprintjs/core";
import { useAppStore } from "../store";
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { error, info } from "@tauri-apps/plugin-log";

const DeviceInfo: React.FC = () => {
  const { appVersion, connected, setConnected } = useAppStore();

  useEffect(() => {
    if (connected) {
      return;
    }

    const interval = setInterval(() => {
      invoke("connect_sensor")
        .then(() => setConnected(true))
        .catch(error);
    }, 5000);

    return () => clearInterval(interval);
  }, [connected, setConnected]);

  return (
    <div>
      <h2>
        <Icon icon="info-sign" /> Device Info
      </h2>
      <p>Firmware: v1.0.0</p>
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
