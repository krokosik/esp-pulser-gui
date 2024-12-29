import { Navbar, Alignment, Button, Card, Elevation } from "@blueprintjs/core";
import DeviceInfo from "./components/DeviceInfo";
import HeartbeatPlot from "./components/HeartbeatPlot";
import Logs from "./components/Logs";
import UpdateStatus from "./components/UpdateStatus";
import NetworkingStatus from "./components/NetworkingStatus";
import { useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { attachConsole, info } from "@tauri-apps/plugin-log";
import { useAppStore } from "./store";

const App: React.FC = () => {
  const { setAppVersion } = useAppStore();

  useEffect(() => {
    const detachPromise = attachConsole();

    getVersion().then((appVersion) => {
      info(`App version: ${appVersion}`);
      setAppVersion(appVersion);
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
          <Button className="bp5-minimal" icon="refresh" text="Reconnect" />
          <Button className="bp5-minimal" icon="reset" text="Restart board" />
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
        <Card elevation={Elevation.TWO}>
          <NetworkingStatus />
        </Card>
        <Card elevation={Elevation.TWO} style={{ gridColumn: "span 3" }}>
          <HeartbeatPlot />
        </Card>
        <Card elevation={Elevation.TWO} style={{ gridColumn: "span 3" }}>
          <Logs />
        </Card>
      </div>
    </div>
  );
};

export default App;
