import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi, type ListJobsParams } from "@/api/endpoints/jobs";
import type { Job, JobStatus, LineItemType } from "@/types/models";

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
    mutationFn: ({ id, status, coords }: { id: string; status: JobStatus; coords?: { latitude: number; longitude: number } }) =>
      jobsApi.changeStatus(id, status, coords),
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

export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Job> }) =>
      jobsApi.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", id] });
    },
  });
}

export function useToggleChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      itemId,
      completed,
    }: {
      jobId: string;
      itemId: string;
      completed: boolean;
    }) => jobsApi.toggleChecklistItem(jobId, itemId, completed),
    onSuccess: (_data, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ["jobs", jobId] });
    },
  });
}

export function useNotifyOnMyWay() {
  return useMutation({
    mutationFn: (id: string) => jobsApi.notifyOnMyWay(id),
  });
}
