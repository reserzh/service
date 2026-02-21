import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signaturesApi } from "@/api/endpoints/signatures";
import type { SignerRole } from "@/types/models";

export function useUploadSignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      base64,
      signerName,
      signerRole,
    }: {
      jobId: string;
      base64: string;
      signerName: string;
      signerRole: SignerRole;
    }) => signaturesApi.upload(jobId, { base64, signerName, signerRole }),
    onSuccess: (_data, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ["jobs", jobId] });
    },
  });
}
