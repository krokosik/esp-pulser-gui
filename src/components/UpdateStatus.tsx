import { Button, Icon } from "@blueprintjs/core";
import { useAppStore } from "../store";

const UpdateStatus: React.FC = () => {
  const { firmwareUpdateAvailable, connected, guiUpdateAvailable } =
    useAppStore();
  return (
    <div>
      <h2>
        <Icon icon="git-branch" /> Update Status
      </h2>
      <p>GUI Update: {guiUpdateAvailable ? "Available" : "Up to date"}</p>
      <Button
        icon="cloud-upload"
        text="GUI Update"
        style={{ display: "block", margin: "auto", marginBottom: "10px" }}
        disabled={!connected || !guiUpdateAvailable}
      />
      {connected && (
        <p>
          Firmware Update:{" "}
          {firmwareUpdateAvailable ? "Available" : "Up to date"}
        </p>
      )}
      {connected && (
        <Button
          icon="cloud-download"
          text="OTA Firmware Update"
          style={{ display: "block", margin: "auto" }}
          disabled={!connected || !firmwareUpdateAvailable}
        />
      )}
    </div>
  );
};

export default UpdateStatus;
