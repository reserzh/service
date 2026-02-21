import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ClockStatus = "clocked_out" | "clocked_in" | "on_break";

interface TimeTrackingState {
  status: ClockStatus;
  clockInTime: string | null;
  breakStartTime: string | null;
  totalBreakMs: number;

  clockIn: () => void;
  clockOut: () => void;
  startBreak: () => void;
  endBreak: () => void;
  restore: () => Promise<void>;
}

const STORAGE_KEY = "time_tracking_state";

async function persist(state: Partial<TimeTrackingState>) {
  const data = {
    status: state.status,
    clockInTime: state.clockInTime,
    breakStartTime: state.breakStartTime,
    totalBreakMs: state.totalBreakMs,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const useTimeTrackingStore = create<TimeTrackingState>((set, get) => ({
  status: "clocked_out",
  clockInTime: null,
  breakStartTime: null,
  totalBreakMs: 0,

  clockIn: () => {
    const now = new Date().toISOString();
    set({ status: "clocked_in", clockInTime: now, breakStartTime: null, totalBreakMs: 0 });
    persist({ ...get(), status: "clocked_in", clockInTime: now });
  },

  clockOut: () => {
    set({ status: "clocked_out", clockInTime: null, breakStartTime: null, totalBreakMs: 0 });
    persist({ status: "clocked_out", clockInTime: null, breakStartTime: null, totalBreakMs: 0 });
  },

  startBreak: () => {
    const now = new Date().toISOString();
    set({ status: "on_break", breakStartTime: now });
    persist({ ...get(), status: "on_break", breakStartTime: now });
  },

  endBreak: () => {
    const state = get();
    const breakMs = state.breakStartTime
      ? Date.now() - new Date(state.breakStartTime).getTime()
      : 0;
    const totalBreakMs = state.totalBreakMs + breakMs;
    set({ status: "clocked_in", breakStartTime: null, totalBreakMs });
    persist({ ...get(), status: "clocked_in", breakStartTime: null, totalBreakMs });
  },

  restore: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({
          status: data.status ?? "clocked_out",
          clockInTime: data.clockInTime ?? null,
          breakStartTime: data.breakStartTime ?? null,
          totalBreakMs: data.totalBreakMs ?? 0,
        });
      }
    } catch {
      // ignore restore errors
    }
  },
}));
