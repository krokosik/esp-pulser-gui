import { create } from "zustand";

interface AppState {
  appVersion: string;
  setAppVersion: (version: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  appVersion: "v0.0.0",
  setAppVersion: (appVersion) => set({ appVersion }),
}));
