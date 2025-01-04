import { Icon, Button } from "@blueprintjs/core";
import { useAppStore } from "../store";
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { info } from "@tauri-apps/plugin-log";

const DeviceInfo: React.FC = () => {
  const { appVersion, connected, setConnected } = useAppStore();

  useEffect(() => {
    if (connected) {
      return;
    }

    const interval = setInterval(async () => {
      const res = await invoke("connect_sensor");
      info(`Connected to sensor: ${res}`);
      setConnected(true);
    }, 2000);

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
