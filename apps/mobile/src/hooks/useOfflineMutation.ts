import { useMutation, useQueryClient } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import {
  useSyncQueueStore,
  type SyncMutationType,
} from "@/stores/syncQueue";
import type { QueryClient } from "@tanstack/react-query";

interface OfflineMutationOptions<TVariables> {
  /** The sync queue mutation type identifier */
  type: SyncMutationType;
  /** Execute the API call when online */
  mutationFn: (variables: TVariables) => Promise<unknown>;
  /** Convert variables to a serializable payload for the sync queue */
  toPayload: (variables: TVariables) => Record<string, unknown>;
  /** Query keys to invalidate on success (or after sync) */
  invalidateKeys?: (variables: TVariables) => string[][];
  /** Optimistic update to apply immediately to the query cache */
  optimisticUpdate?: (
    queryClient: QueryClient,
    variables: TVariables
  ) => void;
  /** Called after successful online mutation, before cache invalidation */
  onSuccess?: (
    queryClient: QueryClient,
    variables: TVariables,
    result: unknown
  ) => void;
}

/**
 * Factory hook that wraps a mutation to work offline.
 *
 * When online: executes with optimistic update, invalidates queries on success.
 * When offline: queues the mutation, applies optimistic update, syncs later.
 */
export function useOfflineMutation<TVariables>(
  options: OfflineMutationOptions<TVariables>
) {
  const queryClient = useQueryClient();
  const enqueue = useSyncQueueStore((s) => s.enqueue);

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const keys = options.invalidateKeys?.(variables) ?? [];

      // Check connectivity at call time, not render time
      const netState = await NetInfo.fetch();
      const offline = !netState.isConnected;

      // Apply optimistic update in both paths for consistent UX
      if (options.optimisticUpdate) {
        options.optimisticUpdate(queryClient, variables);
      }

      if (offline) {
        // Queue for later sync
        enqueue(options.type, options.toPayload(variables), keys);
        return undefined;
      }

      // Online — execute immediately
      try {
        const result = await options.mutationFn(variables);

        // Let caller merge result into cache before invalidation
        if (options.onSuccess) {
          options.onSuccess(queryClient, variables, result);
        }

        // Invalidate caches to get server truth
        for (const key of keys) {
          queryClient.invalidateQueries({ queryKey: key });
        }

        return result;
      } catch (error) {
        // Rollback optimistic update by invalidating
        for (const key of keys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
        throw error;
      }
    },
  });
}
