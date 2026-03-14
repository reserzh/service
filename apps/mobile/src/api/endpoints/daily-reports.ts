import { api } from "../client";
import type { ApiResponse } from "@/types/models";

export interface DailyReportInput {
  materialRequests?: string;
  equipmentIssues?: string;
  officeNotes?: string;
}

export interface DailyReport {
  id: string;
  userId: string;
  reportDate: string;
  materialRequests: string | null;
  equipmentIssues: string | null;
  officeNotes: string | null;
  createdAt: string;
}

export const dailyReportsApi = {
  create(input: DailyReportInput) {
    return api.post<ApiResponse<DailyReport>>("/daily-reports", input);
  },
};
