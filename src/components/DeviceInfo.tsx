import { Icon, Button } from "@blueprintjs/core";
import { useAppStore } from "../store";

const DeviceInfo: React.FC = () => {
  const { appVersion, connected } = useAppStore();

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
