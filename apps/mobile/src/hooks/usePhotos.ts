import { useMutation, useQueryClient } from "@tanstack/react-query";
import { photosApi } from "@/api/endpoints/photos";
import { useOfflineMutation } from "./useOfflineMutation";
import { saveOfflinePhoto } from "@/lib/offlinePhotos";
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
