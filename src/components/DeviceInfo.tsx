import { Button, Icon } from "@blueprintjs/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";
import { useAppStore } from "../store";

const DeviceInfo: React.FC = () => {
  const { appVersion, connected, setConnected } = useAppStore();

  useEffect(() => {
    const unlistenPromise = listen("connection", (event) => {
      const connected = event.payload as boolean;
      console.log("Connection event:", connected);
      setConnected(connected);
    });

    return () => {
      unlistenPromise.then((fn) => fn());
    };
  }, [setConnected]);

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
