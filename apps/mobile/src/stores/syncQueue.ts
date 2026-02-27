import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type SyncMutationType =
  | "photo_upload"
  | "checklist_toggle"
  | "job_status_change"
  | "add_job_note"
  | "time_tracking"
  | "add_line_item";

export type SyncItemStatus = "pending" | "processing" | "failed";

export interface SyncQueueItem {
  id: string;
  type: SyncMutationType;
  payload: Record<string, unknown>;
  /** TanStack Query keys to invalidate after successful sync */
  invalidateKeys: string[][];
  retryCount: number;
  maxRetries: number;
  lastAttemptAt: string | null;
  status: SyncItemStatus;
  lastError: string | null;
  createdAt: string;
}

interface SyncQueueState {
  items: SyncQueueItem[];
  isProcessing: boolean;

  enqueue: (
    type: SyncMutationType,
    payload: Record<string, unknown>,
    invalidateKeys?: string[][]
  ) => string;
  dequeue: (id: string) => void;
  markProcessing: (id: string) => void;
  markFailed: (id: string, error: string) => void;
  markPermanentlyFailed: (id: string, error: string) => void;
  setProcessing: (processing: boolean) => void;
  /** Atomically start processing — returns true if lock acquired, false if already processing */
  tryStartProcessing: () => boolean;
  getNextPending: () => SyncQueueItem | undefined;
  getPendingCount: () => number;
  getFailedCount: () => number;
  clear: () => void;
  restore: () => Promise<void>;
}

const STORAGE_KEY = "sync_queue";

let counter = 0;
function generateId(): string {
  counter += 1;
  return `sq_${Date.now()}_${counter}`;
}

async function persist(items: SyncQueueItem[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const useSyncQueueStore = create<SyncQueueState>((set, get) => ({
  items: [],
  isProcessing: false,

  enqueue: (type, payload, invalidateKeys = []) => {
    const id = generateId();
    const item: SyncQueueItem = {
      id,
      type,
      payload,
      invalidateKeys,
      retryCount: 0,
      maxRetries: 5,
      lastAttemptAt: null,
      status: "pending",
      lastError: null,
      createdAt: new Date().toISOString(),
    };
    const items = [...get().items, item];
    set({ items });
    persist(items);
    return id;
  },

  dequeue: (id) => {
    const items = get().items.filter((i) => i.id !== id);
    set({ items });
    persist(items);
  },

  markProcessing: (id) => {
    const items = get().items.map((i) =>
      i.id === id
        ? { ...i, status: "processing" as const, lastAttemptAt: new Date().toISOString() }
        : i
    );
    set({ items });
    persist(items);
  },

  markFailed: (id, error) => {
    const items = get().items.map((i) =>
      i.id === id
        ? {
            ...i,
            status: "pending" as const,
            retryCount: i.retryCount + 1,
            lastError: error,
          }
        : i
    );
    set({ items });
    persist(items);
  },

  markPermanentlyFailed: (id, error) => {
    const items = get().items.map((i) =>
      i.id === id
        ? { ...i, status: "failed" as const, lastError: error }
        : i
    );
    set({ items });
    persist(items);
  },

  setProcessing: (isProcessing) => set({ isProcessing }),

  tryStartProcessing: () => {
    const state = get();
    if (state.isProcessing) return false;
    set({ isProcessing: true });
    return true;
  },

  getNextPending: () => {
    return get().items.find(
      (i) => i.status === "pending" && i.retryCount < i.maxRetries
    );
  },

  getPendingCount: () => {
    return get().items.filter(
      (i) => i.status === "pending" || i.status === "processing"
    ).length;
  },

  getFailedCount: () => {
    return get().items.filter((i) => i.status === "failed").length;
  },

  clear: () => {
    set({ items: [] });
    persist([]);
  },

  restore: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const items: SyncQueueItem[] = JSON.parse(raw);
        // Reset any items stuck in "processing" back to "pending"
        const restored = items.map((i) =>
          i.status === "processing" ? { ...i, status: "pending" as const } : i
        );
        set({ items: restored });
      }
    } catch {
      // ignore restore errors
    }
  },
}));
