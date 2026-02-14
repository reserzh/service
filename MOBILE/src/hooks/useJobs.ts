import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi, type ListJobsParams } from "@/api/endpoints/jobs";
import type { JobStatus, LineItemType } from "@/types/models";

export function useJobs(params?: ListJobsParams) {
  return useQuery({
    queryKey: ["jobs", params],
    queryFn: () => jobsApi.list(params),
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ["jobs", id],
    queryFn: () => jobsApi.get(id),
    enabled: !!id,
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: JobStatus }) =>
      jobsApi.changeStatus(id, status),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", id] });
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
  });
}

export function useAddJobNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content, isInternal }: { id: string; content: string; isInternal?: boolean }) =>
      jobsApi.addNote(id, content, isInternal),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["jobs", id] });
    },
  });
}

export function useAddJobLineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      item,
    }: {
      id: string;
      item: { description: string; quantity: number; unitPrice: number; type?: LineItemType };
    }) => jobsApi.addLineItem(id, item),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["jobs", id] });
    },
  });
}
