import { FormGroup, Icon, NumericInput } from "@blueprintjs/core";
import React from "react";
import { useAppStore } from "../store";

const NetworkingStatus: React.FC = () => {
  const { tdUdpPort, setTdUdpPort, sensorStatus } = useAppStore();

  const handleUdpChange = (value: string) => {
    setTdUdpPort(Math.min(Math.max(parseInt(value), 1024), 65535) || 0);
  };

  return (
    <div>
      <h2>
        <Icon icon="globe-network" /> Networking & Status
      </h2>
      <FormGroup label="TD UDP Port" inline>
        <NumericInput
          style={{ width: "80px" }}
          placeholder="Enter TD UDP Port"
          value={tdUdpPort}
          onChange={(e) => handleUdpChange(e.target.value)}
          buttonPosition="none"
        />
      </FormGroup>
      <p>
        Heartbeat:{" "}
        <strong style={{ color: sensorStatus?.heart_ok ? "green" : "red" }}>
          {sensorStatus?.heart_ok ? "OK" : "Err"}
        </strong>
      </p>
      <p>
        Motor:{" "}
        <strong style={{ color: sensorStatus?.haptic_ok ? "green" : "red" }}>
          {sensorStatus?.haptic_ok ? "OK" : "Err"}
        </strong>
      </p>
      <p>
        Display:{" "}
        <strong style={{ color: sensorStatus?.display_ok ? "green" : "red" }}>
          {sensorStatus?.display_ok ? "OK" : "Err"}
        </strong>
      </p>
    </div>
  );
};

export default NetworkingStatus;
