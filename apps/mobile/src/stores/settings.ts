import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TradeType } from "@fieldservice/api-types/constants";

type MapApp = "default" | "google" | "waze";
type DarkModeOverride = "system" | "light" | "dark";

interface SettingsState {
  preferredMapApp: MapApp;
  darkModeOverride: DarkModeOverride;
  notifyJobAssigned: boolean;
  notifyJobUpdated: boolean;
  notifyNewEstimate: boolean;
  tradeType: TradeType | null;

  setPreferredMapApp: (app: MapApp) => void;
  setDarkModeOverride: (mode: DarkModeOverride) => void;
  setNotifyJobAssigned: (enabled: boolean) => void;
  setNotifyJobUpdated: (enabled: boolean) => void;
  setNotifyNewEstimate: (enabled: boolean) => void;
  setTradeType: (tradeType: TradeType | null) => void;
  restore: () => Promise<void>;
}

const STORAGE_KEY = "app_settings";

async function persist(state: Partial<SettingsState>) {
  const data = {
    preferredMapApp: state.preferredMapApp,
    darkModeOverride: state.darkModeOverride,
    notifyJobAssigned: state.notifyJobAssigned,
    notifyJobUpdated: state.notifyJobUpdated,
    notifyNewEstimate: state.notifyNewEstimate,
    tradeType: state.tradeType,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  preferredMapApp: "default",
  darkModeOverride: "dark",
  notifyJobAssigned: true,
  notifyJobUpdated: true,
  notifyNewEstimate: true,
  tradeType: null,

  setPreferredMapApp: (preferredMapApp) => {
    set({ preferredMapApp });
    persist(get());
  },
  setDarkModeOverride: (darkModeOverride) => {
    set({ darkModeOverride });
    persist(get());
  },
  setNotifyJobAssigned: (notifyJobAssigned) => {
    set({ notifyJobAssigned });
    persist(get());
  },
  setNotifyJobUpdated: (notifyJobUpdated) => {
    set({ notifyJobUpdated });
    persist(get());
  },
  setNotifyNewEstimate: (notifyNewEstimate) => {
    set({ notifyNewEstimate });
    persist(get());
  },
  setTradeType: (tradeType) => {
    set({ tradeType });
    persist(get());
  },

  restore: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({
          preferredMapApp: data.preferredMapApp ?? "default",
          darkModeOverride: data.darkModeOverride ?? "dark",
          notifyJobAssigned: data.notifyJobAssigned ?? true,
          notifyJobUpdated: data.notifyJobUpdated ?? true,
          notifyNewEstimate: data.notifyNewEstimate ?? true,
          tradeType: data.tradeType ?? null,
        });
      }
    } catch {
      // ignore
    }
  },
});
