import NetInfo from "@react-native-community/netinfo";
import { AppState, type AppStateStatus } from "react-native";
import { QueryClient } from "@tanstack/react-query";
import { useSyncQueueStore, type SyncQueueItem } from "@/stores/syncQueue";
import { jobsApi } from "@/api/endpoints/jobs";
import { photosApi } from "@/api/endpoints/photos";
import { timeTrackingApi } from "@/api/endpoints/time-tracking";
import { ApiError } from "@/api/client";
import { deleteOfflinePhoto } from "./offlinePhotos";
import type { JobStatus, LineItemType, PhotoType } from "@/types/models";

const BACKOFF_BASE_MS = 1000;
const MAX_BACKOFF_MS = 16000;

function getBackoffDelay(retryCount: number): number {
  return Math.min(BACKOFF_BASE_MS * Math.pow(2, retryCount), MAX_BACKOFF_MS);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a single sync queue item against the API.
 */
async function executeMutation(item: SyncQueueItem): Promise<void> {
  const p = item.payload;

  switch (item.type) {
    case "photo_upload": {
      await photosApi.upload(
        p.jobId as string,
        p.fileUri as string,
        p.mimeType as string,
        p.caption as string | undefined,
        p.photoType as PhotoType | undefined
      );
      // Clean up persisted offline photo using the stored photo ID
      const photoId = (p.offlinePhotoId as string) ?? item.id;
      deleteOfflinePhoto(photoId);
      break;
    }
    case "checklist_toggle": {
      await jobsApi.toggleChecklistItem(
        p.jobId as string,
        p.itemId as string,
        p.completed as boolean
      );
      break;
    }
    case "job_status_change": {
      await jobsApi.changeStatus(
        p.id as string,
        p.status as JobStatus,
        p.coords as { latitude: number; longitude: number } | undefined
      );
      break;
    }
    case "add_job_note": {
      await jobsApi.addNote(
        p.id as string,
        p.content as string,
        p.isInternal as boolean | undefined
      );
      break;
    }
    case "add_line_item": {
      await jobsApi.addLineItem(p.id as string, {
        description: p.description as string,
        quantity: p.quantity as number,
        unitPrice: p.unitPrice as number,
        type: p.type as LineItemType | undefined,
      });
      break;
    }
    case "time_tracking": {
      const action = p.action as string;
      const coords = p.coords as
        | { latitude: number; longitude: number }
        | undefined;
      switch (action) {
        case "clock_in":
          await timeTrackingApi.clockIn(coords);
          break;
        case "clock_out":
          await timeTrackingApi.clockOut(coords);
          break;
        case "break_start":
          await timeTrackingApi.breakStart(coords);
          break;
        case "break_end":
          await timeTrackingApi.breakEnd(coords);
          break;
      }
      break;
    }
  }
}

/**
 * Process the sync queue sequentially.
 * Called when connectivity is restored or app comes to foreground.
 */
export async function processSyncQueue(queryClient: QueryClient): Promise<void> {
  const store = useSyncQueueStore.getState();

  // Atomically acquire processing lock — prevents concurrent processing
  if (!store.tryStartProcessing()) return;

  // Check connectivity before starting
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    useSyncQueueStore.getState().setProcessing(false);
    return;
  }

  try {
    let next = store.getNextPending();

    while (next) {
      // Re-check connectivity before each item
      const currentNet = await NetInfo.fetch();
      if (!currentNet.isConnected) break;

      store.markProcessing(next.id);

      try {
        await executeMutation(next);
        // Success — remove from queue and invalidate caches
        store.dequeue(next.id);
        for (const key of next.invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      } catch (error) {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          // Client error — permanent failure, server rejected
          store.markPermanentlyFailed(next.id, error.message);
        } else {
          // Server/network error — retry with backoff
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          store.markFailed(next.id, errorMsg);

          // If retries left, wait with backoff
          const updatedItem = useSyncQueueStore
            .getState()
            .items.find((i) => i.id === next!.id);
          if (updatedItem && updatedItem.retryCount < updatedItem.maxRetries) {
            await delay(getBackoffDelay(updatedItem.retryCount));
          }
        }
      }

      // Get next item (re-read from store in case state changed)
      next = useSyncQueueStore.getState().getNextPending();
    }
  } finally {
    useSyncQueueStore.getState().setProcessing(false);
  }
}

/**
 * Set up listeners that trigger sync queue processing:
 * - NetInfo connectivity restored
 * - AppState becomes "active" (foreground)
 *
 * Returns a cleanup function.
 */
export function startSyncListeners(queryClient: QueryClient): () => void {
  // Listen for connectivity changes
  const netUnsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      processSyncQueue(queryClient);
    }
  });

  // Listen for app foreground
  const appStateSubscription = AppState.addEventListener(
    "change",
    (nextState: AppStateStatus) => {
      if (nextState === "active") {
        processSyncQueue(queryClient);
      }
    }
  );

  return () => {
    netUnsubscribe();
    appStateSubscription.remove();
  };
}
