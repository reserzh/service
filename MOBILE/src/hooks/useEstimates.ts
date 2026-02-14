import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { estimatesApi, type ListEstimatesParams, type CreateEstimateInput } from "@/api/endpoints/estimates";

export function useEstimates(params?: ListEstimatesParams) {
  return useQuery({
    queryKey: ["estimates", params],
    queryFn: () => estimatesApi.list(params),
  });
}

export function useEstimate(id: string) {
  return useQuery({
    queryKey: ["estimates", id],
    queryFn: () => estimatesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateEstimate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEstimateInput) => estimatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
    },
  });
}
