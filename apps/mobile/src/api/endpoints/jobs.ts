import { api } from "../client";
import type {
  Job,
  JobWithRelations,
  JobLineItem,
  JobNote,
  JobStatus,
  LineItemType,
  ApiListResponse,
  ApiResponse,
} from "@/types/models";

export interface ListJobsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string; // comma-separated for multiple
  priority?: string;
  assignedTo?: string;
  customerId?: string;
  from?: string;
  to?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export const jobsApi = {
  list(params?: ListJobsParams) {
    return api.get<ApiListResponse<Job>>("/jobs", params as Record<string, string>);
  },

  get(id: string) {
    return api.get<ApiResponse<JobWithRelations>>(`/jobs/${id}`);
  },

  update(id: string, data: Partial<Job>) {
    return api.patch<ApiResponse<Job>>(`/jobs/${id}`, data);
  },

  changeStatus(id: string, status: JobStatus, coords?: { latitude: number; longitude: number }) {
    return api.post<ApiResponse<Job>>(`/jobs/${id}/status`, {
      status,
      ...(coords && { latitude: coords.latitude, longitude: coords.longitude }),
    });
  },

  assign(id: string, technicianId: string | null) {
    return api.post<ApiResponse<Job>>(`/jobs/${id}/assign`, { technicianId });
  },

  addNote(id: string, content: string, isInternal = true) {
    return api.post<ApiResponse<JobNote>>(`/jobs/${id}/notes`, { content, isInternal });
  },

  addLineItem(
    id: string,
    item: { description: string; quantity: number; unitPrice: number; type?: LineItemType }
  ) {
    return api.post<ApiResponse<JobLineItem>>(`/jobs/${id}/line-items`, item);
  },

  toggleChecklistItem(jobId: string, itemId: string, completed: boolean) {
    return api.patch<ApiResponse<Job>>(`/jobs/${jobId}/checklist/${itemId}`, { completed });
  },

  notifyOnMyWay(id: string) {
    return api.post<ApiResponse<{ success: boolean }>>(`/jobs/${id}/on-my-way`);
  },
};
