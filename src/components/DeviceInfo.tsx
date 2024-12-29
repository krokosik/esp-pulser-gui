import { Icon, Button } from "@blueprintjs/core";
import { useAppStore } from "../store";

const DeviceInfo: React.FC = () => {
  const { appVersion } = useAppStore();

  return (
    <div>
      <h2>
        <Icon icon="info-sign" /> Device Info
      </h2>
      <p>Firmware: v{appVersion}</p>
      <p>App Version: v1.0.0</p>
      <p>
        Connected: <strong style={{ color: "green" }}>Yes</strong>
      </p>
      <Button icon="refresh" text="Check for Updates" />
    </div>
  );
};

export default DeviceInfo;
