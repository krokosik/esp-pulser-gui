import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { error } from "@tauri-apps/plugin-log";
import { Store } from "@tauri-apps/plugin-store";
import { create } from "zustand";

const store = await Store.load("store.json");
const appVersion = await getVersion();
const sensorIpAddress = (await store.get<string>("sensor_ip_address")) || "";
const tdUdpPort = (await store.get<number>("td_udp_port")) || 1024;

export interface SensorStatus {
  version: [number, number, number];
  connected: boolean;
  display_ok: boolean;
  haptic_ok: boolean;
  heart_ok: boolean;
  led_amplitude: number;
  haptic_amplitude: number;
}

interface AppState {
  connected: boolean;
  dummyData: boolean;
  guiUpdateAvailable: boolean;
  appVersion: string;
  sensorIpAddress: string;
  tdUdpPort: number;
  sensorStatus: SensorStatus | null;
  firmwareVersion: string | null;
  setConnected: (connected: boolean) => void;
  toggleDummyData: () => void;
  setGuiUpdateAvailable: (available: boolean) => void;
  setFirmwareVersionAvailable: (firmwareVersion: string) => void;
  setSensorIpAddress: (sensorIpAddress: string) => void;
  setTdUdpPort: (tdUdpPort: number) => void;
  setSensorStatus: (sensorStatus: SensorStatus | null) => void;
  setLedAmplitude: (amplitude: number) => void;
  setHapticAmplitude: (amplitude: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  appVersion,
  connected: false,
  dummyData: false,
  guiUpdateAvailable: false,
  sensorIpAddress,
  tdUdpPort,
  sensorStatus: null,
  firmwareVersion: null,
  setConnected: (connected) => {
    if (!connected) set({ sensorStatus: null });
    set({ connected });
  },
  toggleDummyData: async () => {
    await invoke("set_dummy_data", { emitDummy: !get().dummyData });
    set((state) => ({ dummyData: !state.dummyData }));
  },
  setGuiUpdateAvailable: (guiUpdateAvailable) => set({ guiUpdateAvailable }),
  setFirmwareVersionAvailable: (firmwareVersion) => set({ firmwareVersion }),
  setSensorIpAddress: async (sensorIpAddress) => {
    try {
      await store.set("sensor_ip_address", sensorIpAddress);
      await store.save();

      set({ sensorIpAddress, connected: false });
    } catch (e: any) {
      await error(e);
    }
  },
  setSensorStatus: (sensorStatus) => set({ sensorStatus }),
  setTdUdpPort: async (tdUdpPort) => {
    await store.set("td_udp_port", tdUdpPort);
    await store.save();
    await invoke("change_td_port", { port: tdUdpPort });
    set({ tdUdpPort });
  },
  setLedAmplitude: async (amplitude: number) => {
    await invoke("change_led_amplitude", { amplitude });
  },
  setHapticAmplitude: async (amplitude: number) => {
    await invoke("change_haptic_amplitude", { amplitude });
  },
}));
