import { api } from "../client";
import type { JobPhoto, PhotoType, ApiResponse } from "@/types/models";

export const photosApi = {
  list(jobId: string) {
    return api.get<ApiResponse<JobPhoto[]>>(`/jobs/${jobId}/photos`);
  },

  upload(jobId: string, fileUri: string, mimeType: string, caption?: string, photoType?: PhotoType) {
    const formData = new FormData();

    // React Native FormData accepts uri-based objects
    formData.append("photo", {
      uri: fileUri,
      type: mimeType,
      name: `photo.${mimeType === "image/png" ? "png" : "jpg"}`,
    } as unknown as Blob);

    if (caption) {
      formData.append("caption", caption);
    }

    if (photoType) {
      formData.append("photoType", photoType);
    }

    return api.upload<ApiResponse<JobPhoto>>(`/jobs/${jobId}/photos`, formData);
  },

  delete(jobId: string, photoId: string) {
    return api.delete(`/jobs/${jobId}/photos/${photoId}`);
  },
};
