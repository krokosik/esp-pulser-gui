import { Button, Icon, MenuItem } from "@blueprintjs/core";
import { ItemRenderer, Select } from "@blueprintjs/select";
import { LazyLog } from "@melloware/react-logviewer";
import { appLogDir } from "@tauri-apps/api/path";
import { readDir, readTextFile } from "@tauri-apps/plugin-fs";
import { useCallback, useEffect, useState } from "react";

const Logs: React.FC = () => {
  const [logFiles, setLogFiles] = useState<string[]>([]);
  const [selectedLogFile, setSelectedLogFile] =
    useState<string>("esp-pulser-gui.log");
  const [logContent, setLogContent] = useState<string>("");

  const readLogFiles = useCallback(async () => {
    const dir = await appLogDir();
    const files = await readDir(dir);
    const filenames = files.map((file) => file.name);
    setLogFiles(filenames);
  }, []);

  useEffect(() => {
    readLogFiles();
  }, []);

  const readLogContent = useCallback(async () => {
    if (!selectedLogFile) {
      return;
    }

    const dir = await appLogDir();
    const path = `${dir}/${selectedLogFile}`;
    setLogContent(await readTextFile(path));
  }, [selectedLogFile]);

  useEffect(() => {
    readLogContent();
  }, [readLogContent]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>
          <Icon icon="console" /> Device Logs
        </h2>
        <Select<string>
          items={logFiles}
          itemRenderer={renderFile}
          onItemSelect={setSelectedLogFile}
        >
          <Button
            text={selectedLogFile || "Select a log file"}
            rightIcon="document-open"
          />
        </Select>
        <Button
          onClick={() => {
            readLogFiles();
            readLogContent();
          }}
          icon="refresh"
          text="Refresh"
        />
      </div>
      <div
        style={{
          height: "600px",
          backgroundColor: "#1C2127",
        }}
      >
        <LazyLog
          extraLines={1}
          enableSearch
          text={logContent}
          caseInsensitive
        />
      </div>
    </div>
  );
};

const renderFile: ItemRenderer<string> = (
  filename,
  { handleClick, handleFocus, modifiers }
) => {
  return (
    <MenuItem
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={filename}
      onClick={handleClick}
      onFocus={handleFocus}
      roleStructure="listoption"
      text={filename}
    />
  );
};

export default Logs;
