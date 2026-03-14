import { api } from "../client";
import type { ApiResponse } from "@/types/models";

export interface PropertyHistoryEntry {
  jobId: string;
  jobNumber: string;
  summary: string;
  status: string;
  jobType: string;
  scheduledStart: string | null;
  completedAt: string | null;
  assignedFirstName: string | null;
  assignedLastName: string | null;
  notes: { content: string; isInternal: boolean; createdAt: string }[];
  photoCount: number;
  checklistSummary: { total: number; completed: number };
}

export interface PropertyHistoryResponse {
  property: {
    id: string;
    addressLine1: string;
    city: string;
    state: string;
    accessNotes: string | null;
    gateCode: string | null;
    obstacles: string[] | null;
  };
  recentJobs: PropertyHistoryEntry[];
}

export const propertiesApi = {
  getHistory(propertyId: string, limit: number = 5) {
    return api.get<ApiResponse<PropertyHistoryResponse>>(
      `/properties/${propertyId}/history`,
      { limit: String(limit) }
    );
  },
};
