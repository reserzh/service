import { useMutation, useQueryClient } from "@tanstack/react-query";
import { photosApi } from "@/api/endpoints/photos";
import type { PhotoType } from "@/types/models";

export function useUploadPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      fileUri,
      mimeType,
      caption,
      photoType,
    }: {
      jobId: string;
      fileUri: string;
      mimeType: string;
      caption?: string;
      photoType?: PhotoType;
    }) => photosApi.upload(jobId, fileUri, mimeType, caption, photoType),
    onSuccess: (_data, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ["jobs", jobId] });
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
