import { useSyncQueueStore } from "@/stores/syncQueue";

/**
 * Exposes sync queue status for UI consumption.
 * Uses inline selectors that derive counts from items to avoid
 * re-renders on unrelated store updates.
 */
export function useSyncStatus() {
  const pendingCount = useSyncQueueStore((s) =>
    s.items.filter((i) => i.status === "pending" || i.status === "processing").length
  );
  const failedCount = useSyncQueueStore((s) =>
    s.items.filter((i) => i.status === "failed").length
  );
  const isProcessing = useSyncQueueStore((s) => s.isProcessing);

  return {
    pendingCount,
    failedCount,
    isProcessing,
    hasPending: pendingCount > 0,
  };
}
