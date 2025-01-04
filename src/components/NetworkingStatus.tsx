import { FormGroup, Icon, NumericInput } from "@blueprintjs/core";
import React, { useState } from "react";
import { useAppStore } from "../store";

const NetworkingStatus: React.FC = () => {
  const { tdUdpPort, setTdUdpPort } = useAppStore();

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
        I2C addresses: <strong>0x36 0x5A</strong>
      </p>

      <p>
        Motor: <strong style={{ color: "green" }}>OK</strong>
      </p>
      <p>
        Display: <strong style={{ color: "green" }}>OK</strong>
      </p>
    </div>
  );
};

export default NetworkingStatus;
