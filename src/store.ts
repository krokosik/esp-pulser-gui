import { create } from "zustand";

interface AppState {
  connected: boolean;
  guiUpdateAvailable: boolean;
  firmwareUpdateAvailable: boolean;
  appVersion: string;
  setAppVersion: (version: string) => void;
  setConnected: (connected: boolean) => void;
  setGuiUpdateAvailable: (available: boolean) => void;
  setFirmwareUpdateAvailable: (available: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  appVersion: "v0.0.0",
  connected: false,
  guiUpdateAvailable: false,
  firmwareUpdateAvailable: false,
  setAppVersion: (appVersion) => set({ appVersion }),
  setConnected: (connected) => set({ connected }),
  setGuiUpdateAvailable: (guiUpdateAvailable) => set({ guiUpdateAvailable }),
  setFirmwareUpdateAvailable: (firmwareUpdateAvailable) =>
    set({ firmwareUpdateAvailable }),
}));
