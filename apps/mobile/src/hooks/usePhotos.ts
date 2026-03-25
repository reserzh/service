import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { photosApi } from "@/api/endpoints/photos";
import { useOfflineMutation } from "./useOfflineMutation";
import { saveOfflinePhoto } from "@/lib/offlinePhotos";
import { SUPABASE_URL } from "@/lib/constants";
import { photoUriCache } from "@/lib/photoUriCache";
import type { PhotoType, JobWithRelations, JobPhoto } from "@/types/models";

export function useUploadPhoto() {
  return useOfflineMutation<{
    jobId: string;
    fileUri: string;
    mimeType: string;
    caption?: string;
    photoType?: PhotoType;
  }>({
    type: "photo_upload",
    mutationFn: ({ jobId, fileUri, mimeType, caption, photoType }) =>
      photosApi.upload(jobId, fileUri, mimeType, caption, photoType),
    toPayload: ({ jobId, fileUri, mimeType, caption, photoType }) => {
      // Generate stable ID for offline photo file cleanup
      const offlinePhotoId = `offline_${Date.now()}`;
      return {
        jobId,
        fileUri,
        mimeType,
        caption,
        photoType,
        offlinePhotoId,
      };
    },
    invalidateKeys: ({ jobId }) => [["jobs", jobId]],
    optimisticUpdate: (queryClient, { jobId, fileUri, mimeType, caption, photoType }) => {
      const photoId = `offline_${Date.now()}`;

      // Add optimistic photo to the job cache with local file:// URI
      queryClient.setQueryData<{ data: JobWithRelations }>(
        ["jobs", jobId],
        (old) => {
          if (!old) return old;
          const optimisticPhoto: JobPhoto & { _offlineUri?: string; _pending?: boolean } = {
            id: photoId,
            jobId,
            userId: "",
            storagePath: "",
            caption: caption ?? null,
            photoType: photoType ?? "general",
            estimateId: null,
            takenAt: null,
            createdAt: new Date().toISOString(),
            _offlineUri: fileUri,
            _pending: true,
          };
          return {
            ...old,
            data: {
              ...old.data,
              photos: [...(old.data.photos ?? []), optimisticPhoto as JobPhoto],
            },
          };
        }
      );

      // Persist the photo file in background
      saveOfflinePhoto(fileUri, photoId, mimeType).catch(() => {
        // If save fails, the temp URI may still work during the session
      });
    },
    onSuccess: (queryClient, { jobId, fileUri }, result) => {
      const res = result as { data?: JobPhoto } | undefined;
      if (!res?.data?.id) return;
      const serverPhoto = res.data;

      // Cache the local URI keyed by the server photo ID so it survives
      // the query invalidation that follows (getPhotoUrl uses this as fallback)
      photoUriCache.set(serverPhoto.id, fileUri);

      // Replace the optimistic photo with the real one, keeping _offlineUri
      // so the thumbnail stays visible during the background refetch.
      // Match by _offlineUri (not _pending) to avoid clobbering concurrent uploads.
      queryClient.setQueryData<{ data: JobWithRelations }>(
        ["jobs", jobId],
        (old) => {
          if (!old) return old;
          let replaced = false;
          return {
            ...old,
            data: {
              ...old.data,
              photos: old.data.photos.map((p) => {
                if (
                  !replaced &&
                  (p as JobPhoto & { _offlineUri?: string })._offlineUri === fileUri
                ) {
                  replaced = true;
                  return { ...serverPhoto, _offlineUri: fileUri } as JobPhoto;
                }
                return p;
              }),
            },
          };
        }
      );

      // Pre-warm expo-image cache so the remote URL is ready when
      // the refetch eventually drops _offlineUri
      const remoteUrl = `${SUPABASE_URL}/storage/v1/object/public/job-photos/${serverPhoto.storagePath}`;
      Image.prefetch(remoteUrl).catch(() => {});
    },
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, photoId }: { jobId: string; photoId: string }) =>
      photosApi.delete(jobId, photoId),
    onSuccess: (_data, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ["jobs", jobId] });
    },
  });
}
