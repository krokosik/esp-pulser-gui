import {
  Alignment,
  Button,
  Card,
  Elevation,
  FormGroup,
  InputGroup,
  Navbar,
  Switch,
  Tab,
  Tabs,
} from "@blueprintjs/core";
import { attachConsole } from "@tauri-apps/plugin-log";
import { useEffect } from "react";
import DeviceInfo from "./components/DeviceInfo";
import HeartbeatPlot from "./components/HeartbeatPlot";
import Logs from "./components/Logs";
import NetworkingStatus from "./components/NetworkingStatus";
import UpdateStatus from "./components/UpdateStatus";
import { useAppStore } from "./store";
import { invoke } from "@tauri-apps/api/core";
import { SensorCommand } from "./const";

const App: React.FC = () => {
  const {
    sensorIpAddress,
    setSensorIpAddress,
    connected,
    dummyData,
    toggleDummyData,
  } = useAppStore();

  useEffect(() => {
    const detachPromise = attachConsole();

    return () => {
      detachPromise.then((detach) => detach());
    };
  }, []);

  return (
    <div className="app-container" style={{ height: "100vh", padding: "1rem" }}>
      <Navbar>
        <Navbar.Group
          align={Alignment.LEFT}
          style={{ width: "100%", justifyContent: "space-between" }}
        >
          <Navbar.Heading>ESP32 Dashboard</Navbar.Heading>
          <Navbar.Divider />
          <FormGroup label="IP Address" inline style={{ margin: 0 }}>
            <InputGroup
              placeholder="Enter IP Address"
              disabled={connected}
              value={sensorIpAddress}
              onValueChange={setSensorIpAddress}
            />
          </FormGroup>
          <Navbar.Divider />
          <Button
            className="bp5-minimal"
            icon="reset"
            text="Restart board"
            disabled={!connected}
            onClick={() =>
              invoke("sensor_command", {
                command: SensorCommand.Restart,
                data: "",
              })
            }
          />
          <Switch
            checked={dummyData}
            onChange={toggleDummyData}
            style={{ margin: 0 }}
          >
            Dummy Data
          </Switch>
        </Navbar.Group>
      </Navbar>

      <div style={{ marginTop: "1rem" }}>
        <Tabs large animate defaultSelectedTabId="status">
          <Tab
            id="status"
            title="Status"
            panel={
              <div
                className="content-grid"
                style={{
                  display: "grid",
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
              </div>
            }
          />
          <Tab
            id="plot"
            title="Data Plot"
            panel={
              <Card elevation={Elevation.TWO} style={{ gridColumn: "span 3" }}>
                <HeartbeatPlot />
              </Card>
            }
          />
          <Tab
            id="logs"
            title="Logs"
            panel={
              <Card elevation={Elevation.TWO} style={{ gridColumn: "span 3" }}>
                <Logs />
              </Card>
            }
          />
        </Tabs>
      </div>
    </div>
  );
};

export default App;
