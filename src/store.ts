import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { error } from "@tauri-apps/plugin-log";
import { create } from "zustand";

const appVersion = await getVersion();
const sensorIpAddress = await invoke<string>("get_sensor_ip");
const tdUdpPort = await invoke<number>("get_td_udp_port");

interface AppState {
  connected: boolean;
  guiUpdateAvailable: boolean;
  firmwareUpdateAvailable: boolean;
  appVersion: string;
  sensorIpAddress: string;
  tdUdpPort: number;
  setConnected: (connected: boolean) => void;
  setGuiUpdateAvailable: (available: boolean) => void;
  setFirmwareUpdateAvailable: (available: boolean) => void;
  setSensorIpAddress: (sensorIpAddress: string) => void;
  setTdUdpPort: (tdUdpPort: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  appVersion,
  connected: true,
  guiUpdateAvailable: false,
  firmwareUpdateAvailable: false,
  sensorIpAddress,
  tdUdpPort,
  setConnected: (connected) => set({ connected }),
  setGuiUpdateAvailable: (guiUpdateAvailable) => set({ guiUpdateAvailable }),
  setFirmwareUpdateAvailable: (firmwareUpdateAvailable) =>
    set({ firmwareUpdateAvailable }),
  setSensorIpAddress: async (sensorIpAddress) => {
    try {
      const parts = sensorIpAddress.split(".").map(parseInt);
      if (
        parts.length === 4 &&
        parts.every((part) => part > 0 && part <= 255)
      ) {
        await invoke("set_sensor_ip", { ip: sensorIpAddress });
      }
      set({ sensorIpAddress });
    } catch (e: any) {
      await error(e);
    }
  },
  setTdUdpPort: async (tdUdpPort) => {
    await invoke("set_td_udp_port", { port: tdUdpPort });
    set({ tdUdpPort });
  },
}));
