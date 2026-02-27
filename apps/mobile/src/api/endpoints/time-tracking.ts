import { api } from "../client";
import type { TimeEntry, ApiResponse } from "@/types/models";

interface ClockEventParams {
  latitude?: number;
  longitude?: number;
  jobId?: string;
  notes?: string;
}

export const timeTrackingApi = {
  clockIn(params?: ClockEventParams) {
    return api.post<ApiResponse<TimeEntry>>("/time-tracking/clock-in", params || {});
  },

  clockOut(params?: ClockEventParams) {
    return api.post<ApiResponse<TimeEntry>>("/time-tracking/clock-out", params || {});
  },

  breakStart(params?: Omit<ClockEventParams, "jobId">) {
    return api.post<ApiResponse<TimeEntry>>("/time-tracking/break-start", params || {});
  },

  breakEnd(params?: Omit<ClockEventParams, "jobId">) {
    return api.post<ApiResponse<TimeEntry>>("/time-tracking/break-end", params || {});
  },

  getEntries(from: string, to: string, userId?: string) {
    const params: Record<string, string> = { from, to };
    if (userId) params.userId = userId;
    return api.get<ApiResponse<TimeEntry[]>>("/time-tracking/entries", params);
  },
};
