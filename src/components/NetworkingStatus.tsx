import { FormGroup, Icon, NumericInput } from "@blueprintjs/core";
import React from "react";
import { useAppStore } from "../store";
import { invoke } from "@tauri-apps/api/core";

const NetworkingStatus: React.FC = () => {
  const { tdUdpPort, setTdUdpPort, sensorStatus, connected } = useAppStore();
  const [localLedAmp, setLocalLedAmp] = React.useState(0);
  const [localHapticAmp, setLocalHapticAmp] = React.useState(0);
  const handleUdpChange = (value: string) => {
    setTdUdpPort(parseInt(value));
  };

  React.useEffect(() => {
    setLocalLedAmp(sensorStatus?.led_amplitude || 0);
  }, [sensorStatus?.led_amplitude]);

  React.useEffect(() => {
    setLocalHapticAmp(sensorStatus?.haptic_amplitude || 0);
  }, [sensorStatus?.haptic_amplitude]);

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
          onValueChange={(_, val) => handleUdpChange(val)}
          buttonPosition="none"
        />
      </FormGroup>
      <FormGroup label="LED amplitude" inline>
        <NumericInput
          style={{ width: "80px" }}
          value={localLedAmp}
          disabled={!connected && localLedAmp !== sensorStatus?.led_amplitude}
          onValueChange={(_, val) => {
            setLocalLedAmp(parseInt(val));
            invoke("change_led_amplitude", { amplitude: parseInt(val) });
          }}
          min={0}
          max={255}
          stepSize={1}
        />
      </FormGroup>
      <FormGroup label="Haptic amp" inline>
        <NumericInput
          style={{ width: "80px" }}
          value={localHapticAmp}
          disabled={
            !connected && localHapticAmp !== sensorStatus?.haptic_amplitude
          }
          onValueChange={(_, val) => {
            setLocalHapticAmp(parseInt(val));
            invoke("change_haptic_amplitude", { amplitude: parseInt(val) });
          }}
          min={0}
          max={255}
          stepSize={1}
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
