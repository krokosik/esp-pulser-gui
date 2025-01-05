import { getVersion } from "@tauri-apps/api/app";
import { error } from "@tauri-apps/plugin-log";
import { create } from "zustand";
import { Store } from "@tauri-apps/plugin-store";

const store = await Store.load("store.json");
const appVersion = await getVersion();
const sensorIpAddress = (await store.get<string>("sensor_ip_address")) || "";
const tdUdpPort = (await store.get<number>("td_udp_port")) || 1024;

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
      await store.set("sensor_ip_address", sensorIpAddress);
      await store.save();

      set({ sensorIpAddress, connected: false });
    } catch (e: any) {
      await error(e);
    }
  },
  setTdUdpPort: async (tdUdpPort) => {
    await store.set("td_udp_port", tdUdpPort);
    await store.save();
    set({ tdUdpPort });
  },
}));
