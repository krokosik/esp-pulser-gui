import {
  Button,
  FormGroup,
  Icon,
  InputGroup,
  NumericInput,
  Popover,
  ProgressBar,
} from "@blueprintjs/core";
import { useAppStore } from "../store";
import { useCallback, useMemo, useState } from "react";
import { info, warn } from "@tauri-apps/plugin-log";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { invoke } from "@tauri-apps/api/core";
import { SensorCommand } from "../const";

const UpdateStatus: React.FC = () => {
  const {
    firmwareVersion,
    connected,
    guiUpdateAvailable,
    setConnected,
    sensorStatus,
    setGuiUpdateAvailable,
  } = useAppStore();

  const [guiUpdateProgress, setGuiUpdateProgress] = useState<number | null>(
    null
  );

  const [updateUrl, setUpdateUrl] = useState("");

  const updateGui = useCallback(async () => {
    info("Updating GUI");
    const update = await check();
    if (!update) {
      warn("No GUI updates available");
      setGuiUpdateAvailable(false);
      return;
    }

    let downloaded = 0;
    let contentLength = 0;

    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case "Started":
          contentLength = event.data.contentLength!;
          info(`Started downloading ${event.data.contentLength} bytes`);
          break;
        case "Progress":
          downloaded += event.data.chunkLength;
          info(`Downloaded ${downloaded} from ${contentLength}`);
          break;
        case "Finished":
          info("Download finished");
          break;
      }
      setGuiUpdateProgress(downloaded / contentLength);
    });

    info("Update installed, restarting...");
    await relaunch();
  }, []);

  const canUpdateFirmware = useMemo(() => {
    if (!sensorStatus || !firmwareVersion) return false;
    const [major, minor, patch] = sensorStatus.version;
    const [majorUpdate, minorUpdate, patchUpdate] = firmwareVersion
      .split(".")
      .map(Number);

    return (
      majorUpdate > major ||
      (majorUpdate === major &&
        (minorUpdate > minor || (minorUpdate === minor && patchUpdate > patch)))
    );
  }, [sensorStatus, firmwareVersion]);

  return (
    <div>
      <h2>
        <Icon icon="git-branch" /> Update Status
      </h2>
      <p>GUI Update: {guiUpdateAvailable ? "Available" : "Up to date"}</p>
      {guiUpdateProgress === null ? (
        <Button
          icon="cloud-upload"
          text="GUI Update"
          style={{ display: "block", margin: "auto", marginBottom: "10px" }}
          disabled={!guiUpdateAvailable}
          onClick={updateGui}
        />
      ) : (
        <ProgressBar value={guiUpdateProgress} />
      )}
      {connected && (
        <p>Firmware Update: {canUpdateFirmware ? "Available" : "Up to date"}</p>
      )}
      {connected && (
        <Button
          icon="cloud-download"
          text="OTA Firmware Update"
          style={{ display: "block", margin: "auto" }}
          disabled={!connected || !canUpdateFirmware}
          onClick={async () => {
            info(
              "Issuing OTA firmware update command. The board will restart."
            );
            await invoke("sensor_command", {
              command: SensorCommand.Update,
              data: firmwareVersion,
            });
            setConnected(false);
          }}
        />
      )}
      {connected && <p>Firmware update fallback:</p>}
      {connected && (
        <Popover
          interactionKind="click"
          placement="bottom"
          content={
            <>
              <FormGroup label="Provide an update URL">
                <InputGroup
                  value={updateUrl}
                  onValueChange={(val) => setUpdateUrl(val)}
                />
              </FormGroup>
              <Button
                intent="primary"
                type="submit"
                text="OK"
                onClick={async () => {
                  info(
                    "Issuing OTA firmware update command. The board will restart."
                  );
                  await invoke("sensor_command", {
                    command: SensorCommand.Update,
                    data: updateUrl,
                  });
                  setConnected(false);
                }}
              />
            </>
          }
        >
          <Button
            intent="warning"
            text="Custom update"
            style={{ display: "block", margin: "auto" }}
          />
        </Popover>
      )}
      {connected && <p>Only works on firmware ≥0.6.5</p>}
    </div>
  );
};

export default UpdateStatus;
