import {
  Navbar,
  Alignment,
  Button,
  Card,
  Elevation,
  FormGroup,
  InputGroup,
} from "@blueprintjs/core";
import DeviceInfo from "./components/DeviceInfo";
import HeartbeatPlot from "./components/HeartbeatPlot";
import Logs from "./components/Logs";
import UpdateStatus from "./components/UpdateStatus";
import NetworkingStatus from "./components/NetworkingStatus";
import { useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { attachConsole, info } from "@tauri-apps/plugin-log";
import { useAppStore } from "./store";
import { check } from "@tauri-apps/plugin-updater";

const App: React.FC = () => {
  const { setAppVersion, connected, setGuiUpdateAvailable, setConnected } =
    useAppStore();

  useEffect(() => {
    const detachPromise = attachConsole();

    getVersion().then((appVersion) => {
      info(`App version: ${appVersion}`);
      setAppVersion(appVersion);
    });

    check().then((update) => {
      if (update) {
        info(`GUI update available: ${update.version}`);
        setGuiUpdateAvailable(true);
      } else {
        info("No GUI updates available");
        setGuiUpdateAvailable(false);
      }
    });

    return () => {
      detachPromise.then((detach) => detach());
    };
  }, []);

  return (
    <div className="app-container" style={{ height: "100vh", padding: "1rem" }}>
      <Navbar>
        <Navbar.Group align={Alignment.LEFT}>
          <Navbar.Heading>ESP32 Dashboard</Navbar.Heading>
          <Navbar.Divider />
          <FormGroup label="IP Address" inline style={{ margin: 0 }}>
            <InputGroup placeholder="Enter IP Address" disabled={connected} />
          </FormGroup>
          <Navbar.Divider />
          <Button
            className="bp5-minimal"
            icon="refresh"
            text="Reconnect"
            onClick={() => setConnected(false)}
          />
          <Button
            className="bp5-minimal"
            icon="reset"
            text="Restart board"
            disabled={!connected}
          />
        </Navbar.Group>
      </Navbar>

      <div
        className="content-grid"
        style={{
          display: "grid",
          rowGap: "1rem",
          gridTemplateColumns: "1fr 1fr 1fr",
        }}
      >
        <Card elevation={Elevation.TWO}>
          <DeviceInfo />
        </Card>
        <Card elevation={Elevation.TWO}>
          <UpdateStatus />
        </Card>
        {connected && (
          <Card elevation={Elevation.TWO}>
            <NetworkingStatus />
          </Card>
        )}
        {connected && (
          <Card elevation={Elevation.TWO} style={{ gridColumn: "span 3" }}>
            <HeartbeatPlot />
          </Card>
        )}
        <Card elevation={Elevation.TWO} style={{ gridColumn: "span 3" }}>
          <Logs />
        </Card>
      </div>
    </div>
  );
};

export default App;
