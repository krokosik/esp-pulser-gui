import { Icon, Button } from "@blueprintjs/core";

const UpdateStatus: React.FC = () => {
  return (
    <div>
      <h2>
        <Icon icon="git-branch" /> Update Status
      </h2>
      <p>Firmware Update: Available</p>
      <p>GUI Update: Up to date</p>
      <Button icon="cloud-download" text="OTA Firmware Update" />
      <Button
        icon="cloud-upload"
        text="GUI Update"
        style={{ marginLeft: "1rem" }}
      />
    </div>
  );
};

export default UpdateStatus;
