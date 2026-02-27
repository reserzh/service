import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { timeTrackingApi } from "@/api/endpoints/time-tracking";
import { useSyncQueueStore } from "./syncQueue";

type ClockStatus = "clocked_out" | "clocked_in" | "on_break";

interface TimeTrackingState {
  status: ClockStatus;
  clockInTime: string | null;
  breakStartTime: string | null;
  totalBreakMs: number;
  isLoading: boolean;

  clockIn: (coords?: { latitude: number; longitude: number }) => void;
  clockOut: (coords?: { latitude: number; longitude: number }) => void;
  startBreak: (coords?: { latitude: number; longitude: number }) => void;
  endBreak: (coords?: { latitude: number; longitude: number }) => void;
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

function enqueueTimeTracking(
  action: string,
  coords?: { latitude: number; longitude: number }
) {
  useSyncQueueStore.getState().enqueue(
    "time_tracking",
    { action, coords },
    []
  );
}

export const useTimeTrackingStore = create<TimeTrackingState>((set, get) => ({
  status: "clocked_out",
  clockInTime: null,
  breakStartTime: null,
  totalBreakMs: 0,
  isLoading: false,

  clockIn: async (coords) => {
    const now = new Date().toISOString();
    // Optimistic update
    set({ status: "clocked_in", clockInTime: now, breakStartTime: null, totalBreakMs: 0, isLoading: true });
    persist({ ...get(), status: "clocked_in", clockInTime: now });

    try {
      await timeTrackingApi.clockIn({
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
    } catch {
      // Queue failed call for later sync
      enqueueTimeTracking("clock_in", coords);
    } finally {
      set({ isLoading: false });
    }
  },

  clockOut: async (coords) => {
    set({ status: "clocked_out", clockInTime: null, breakStartTime: null, totalBreakMs: 0, isLoading: true });
    persist({ status: "clocked_out", clockInTime: null, breakStartTime: null, totalBreakMs: 0 });

    try {
      await timeTrackingApi.clockOut({
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
    } catch {
      enqueueTimeTracking("clock_out", coords);
    } finally {
      set({ isLoading: false });
    }
  },

  startBreak: async (coords) => {
    const now = new Date().toISOString();
    set({ status: "on_break", breakStartTime: now, isLoading: true });
    persist({ ...get(), status: "on_break", breakStartTime: now });

    try {
      await timeTrackingApi.breakStart({
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
    } catch {
      enqueueTimeTracking("break_start", coords);
    } finally {
      set({ isLoading: false });
    }
  },

  endBreak: async (coords) => {
    const state = get();
    const breakMs = state.breakStartTime
      ? Date.now() - new Date(state.breakStartTime).getTime()
      : 0;
    const totalBreakMs = state.totalBreakMs + breakMs;
    set({ status: "clocked_in", breakStartTime: null, totalBreakMs, isLoading: true });
    persist({ ...get(), status: "clocked_in", breakStartTime: null, totalBreakMs });

    try {
      await timeTrackingApi.breakEnd({
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
    } catch {
      enqueueTimeTracking("break_end", coords);
    } finally {
      set({ isLoading: false });
    }
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
