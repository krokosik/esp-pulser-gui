import { FormGroup, Icon, NumericInput } from "@blueprintjs/core";
import React, { useState } from "react";

const NetworkingStatus: React.FC = () => {
  const [udpPort, setUdpPort] = useState(34254);

  const handleUdpChange = (value: string) => {
    setUdpPort(Math.min(Math.max(parseInt(value), 1024), 65535) || 0);
  };

  return (
    <div>
      <h2>
        <Icon icon="globe-network" /> Networking & Status
      </h2>
      <FormGroup label="UDP Port" inline>
        <NumericInput
          style={{ width: "80px" }}
          placeholder="Enter UDP Port"
          value={udpPort}
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
