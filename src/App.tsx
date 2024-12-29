import { Navbar, Alignment, Button, Card, Elevation } from "@blueprintjs/core";
import DeviceInfo from "./components/DeviceInfo";
import HeartbeatPlot from "./components/HeartbeatPlot";
import Logs from "./components/Logs";
import Sidebar from "./components/Sidebar";
import UpdateStatus from "./components/UpdateStatus";

const App: React.FC = () => {
  return (
    <div className="app-container" style={{ display: "flex", height: "100vh" }}>
      <Sidebar />
      <div className="main-content" style={{ flexGrow: 1, padding: "1rem" }}>
        <Navbar>
          <Navbar.Group align={Alignment.LEFT}>
            <Navbar.Heading>ESP32 Dashboard</Navbar.Heading>
            <Navbar.Divider />
            <Button icon="refresh" text="Reconnect" />
          </Navbar.Group>
        </Navbar>

        <div
          className="content-grid"
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "1fr 1fr",
          }}
        >
          <Card elevation={Elevation.TWO}>
            <DeviceInfo />
          </Card>
          <Card elevation={Elevation.TWO}>
            <UpdateStatus />
          </Card>
          <Card elevation={Elevation.TWO} style={{ gridColumn: "span 2" }}>
            <HeartbeatPlot />
          </Card>
          <Card elevation={Elevation.TWO} style={{ gridColumn: "span 2" }}>
            <Logs />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default App;
