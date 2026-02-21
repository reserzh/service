import { api } from "../client";
import type { JobSignature, ApiResponse, SignerRole } from "@/types/models";

export const signaturesApi = {
  list(jobId: string) {
    return api.get<ApiResponse<JobSignature[]>>(`/jobs/${jobId}/signatures`);
  },

  upload(jobId: string, data: { base64: string; signerName: string; signerRole: SignerRole }) {
    return api.post<ApiResponse<JobSignature>>(`/jobs/${jobId}/signatures`, data);
  },
};
