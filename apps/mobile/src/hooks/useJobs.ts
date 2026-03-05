import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi, type ListJobsParams } from "@/api/endpoints/jobs";
import { useOfflineMutation } from "./useOfflineMutation";
import type { Job, JobStatus, LineItemType, JobWithRelations, JobNote, JobLineItem } from "@/types/models";

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
  return useOfflineMutation<{
    id: string;
    status: JobStatus;
    coords?: { latitude: number; longitude: number };
  }>({
    type: "job_status_change",
    mutationFn: ({ id, status, coords }) =>
      jobsApi.changeStatus(id, status, coords),
    toPayload: ({ id, status, coords }) => ({ id, status, coords }),
    invalidateKeys: ({ id }) => [["jobs"], ["jobs", id], ["schedule"]],
    optimisticUpdate: (queryClient, { id, status }) => {
      queryClient.setQueryData<{ data: JobWithRelations }>(
        ["jobs", id],
        (old) => {
          if (!old) return old;
          return { ...old, data: { ...old.data, status } };
        }
      );
    },
  });
}

export function useAddJobNote() {
  return useOfflineMutation<{
    id: string;
    content: string;
    isInternal?: boolean;
  }>({
    type: "add_job_note",
    mutationFn: ({ id, content, isInternal }) =>
      jobsApi.addNote(id, content, isInternal),
    toPayload: ({ id, content, isInternal }) => ({ id, content, isInternal }),
    invalidateKeys: ({ id }) => [["jobs", id]],
    optimisticUpdate: (queryClient, { id, content, isInternal }) => {
      queryClient.setQueryData<{ data: JobWithRelations }>(
        ["jobs", id],
        (old) => {
          if (!old) return old;
          const optimisticNote: JobNote = {
            id: `temp_${Date.now()}`,
            jobId: id,
            userId: "",
            content,
            isInternal: isInternal ?? true,
            createdAt: new Date().toISOString(),
          };
          return {
            ...old,
            data: {
              ...old.data,
              notes: [optimisticNote, ...old.data.notes],
            },
          };
        }
      );
    },
  });
}

export function useAddJobLineItem() {
  return useOfflineMutation<{
    id: string;
    item: {
      description: string;
      quantity: number;
      unitPrice: number;
      type?: LineItemType;
    };
  }>({
    type: "add_line_item",
    mutationFn: ({ id, item }) => jobsApi.addLineItem(id, item),
    toPayload: ({ id, item }) => ({
      id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      type: item.type,
    }),
    invalidateKeys: ({ id }) => [["jobs", id]],
    optimisticUpdate: (queryClient, { id, item }) => {
      queryClient.setQueryData<{ data: JobWithRelations }>(
        ["jobs", id],
        (old) => {
          if (!old) return old;
          const total = (item.quantity * item.unitPrice).toFixed(2);
          const optimisticItem: JobLineItem = {
            id: `temp_${Date.now()}`,
            jobId: id,
            pricebookItemId: null,
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            total,
            type: item.type ?? "labor",
            sortOrder: old.data.lineItems.length,
            createdAt: new Date().toISOString(),
          };
          return {
            ...old,
            data: {
              ...old.data,
              lineItems: [...old.data.lineItems, optimisticItem],
            },
          };
        }
      );
    },
  });
}

export function useToggleChecklistItem() {
  return useOfflineMutation<{
    jobId: string;
    itemId: string;
    completed: boolean;
  }>({
    type: "checklist_toggle",
    mutationFn: ({ jobId, itemId, completed }) =>
      jobsApi.toggleChecklistItem(jobId, itemId, completed),
    toPayload: ({ jobId, itemId, completed }) => ({
      jobId,
      itemId,
      completed,
    }),
    invalidateKeys: ({ jobId }) => [["jobs", jobId]],
    optimisticUpdate: (queryClient, { jobId, itemId, completed }) => {
      queryClient.setQueryData<{ data: JobWithRelations }>(
        ["jobs", jobId],
        (old) => {
          if (!old?.data?.checklist) return old;
          return {
            ...old,
            data: {
              ...old.data,
              checklist: old.data.checklist.map((ci) =>
                ci.id === itemId ? { ...ci, completed } : ci
              ),
            },
          };
        }
      );
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

