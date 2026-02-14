import { useMutation, useQueryClient } from "@tanstack/react-query";
import { photosApi } from "@/api/endpoints/photos";

export function useUploadPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      fileUri,
      mimeType,
      caption,
    }: {
      jobId: string;
      fileUri: string;
      mimeType: string;
      caption?: string;
    }) => photosApi.upload(jobId, fileUri, mimeType, caption),
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
