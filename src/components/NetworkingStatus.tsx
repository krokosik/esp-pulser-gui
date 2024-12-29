import { FormGroup, Icon, InputGroup } from "@blueprintjs/core";
import React, { useState } from "react";

const NetworkingStatus: React.FC = () => {
  const [udpPort, setUdpPort] = useState(34254);

  const handleUdpChange = (value: string) => {
    setUdpPort(parseInt(value) || 0);
  };

  return (
    <div>
      <h2>
        <Icon icon="globe-network" /> Networking & Status
      </h2>
      <FormGroup label="UDP Stream Port">
        <InputGroup
          placeholder="Enter UDP Port"
          value={udpPort.toString()}
          onChange={(e) => handleUdpChange(e.target.value)}
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
