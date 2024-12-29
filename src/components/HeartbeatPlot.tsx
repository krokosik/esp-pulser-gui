import { Icon } from "@blueprintjs/core";

const HeartbeatPlot: React.FC = () => {
  return (
    <div>
      <h2>
        <Icon icon="timeline-line-chart" /> Heartbeat Signal
      </h2>
      <div
        style={{
          height: "300px",
          backgroundColor: "#1C2127",
          borderRadius: "5px",
        }}
      >
        <p style={{ textAlign: "center", lineHeight: "300px" }}>
          [Live Heartbeat Plot Placeholder]
        </p>
      </div>
    </div>
  );
};

export default HeartbeatPlot;
