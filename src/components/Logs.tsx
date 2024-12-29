import { Icon } from "@blueprintjs/core";

const Logs: React.FC = () => {
  return (
    <div>
      <h2>
        <Icon icon="console" /> Device Logs
      </h2>
      <div
        style={{
          height: "200px",
          backgroundColor: "#1C2127",
          overflowY: "scroll",
        }}
      >
        <pre>
          [12:34:00] Device booted...
          <br />
          [12:35:00] Heartbeat received...
          <br />
          [12:35:10] OTA Update available...
        </pre>
      </div>
    </div>
  );
};

export default Logs;
