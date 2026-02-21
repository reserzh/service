import { api } from "../client";
import type { Job, ApiResponse } from "@/types/models";

export interface ScheduleParams {
  from: string;
  to: string;
  technicianId?: string;
}

export const scheduleApi = {
  get(params: ScheduleParams) {
    return api.get<ApiResponse<Job[]>>("/schedule", params as unknown as Record<string, string>);
  },
};
