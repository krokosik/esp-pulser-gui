import { Menu, MenuItem } from "@blueprintjs/core";

const Sidebar: React.FC = () => {
  return (
    <div
      className="sidebar"
      style={{ width: "250px", backgroundColor: "#2F343C", padding: "1rem" }}
    >
      <h3>Navigation</h3>
      <Menu>
        <MenuItem icon="dashboard" text="Dashboard" />
        <MenuItem icon="diagram-tree" text="Device Info" />
        <MenuItem icon="heat-grid" text="Heartbeat Plot" />
        <MenuItem icon="console" text="Logs" />
        <MenuItem icon="git-branch" text="Updates" />
      </Menu>
    </div>
  );
};

export default Sidebar;
