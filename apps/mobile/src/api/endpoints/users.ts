import { api } from "../client";
import type { UserContext, ApiResponse } from "@/types/models";

export const usersApi = {
  getMe() {
    return api.get<ApiResponse<UserContext>>("/users/me");
  },

  registerPushToken(data: { token: string; platform: "ios" | "android" }) {
    return api.post("/users/me/push-token", data);
  },

  removePushToken() {
    return api.delete("/users/me/push-token");
  },

  clockIn() {
    return api.post<ApiResponse<{ clockedInAt: string }>>("/users/me/clock-in");
  },

  clockOut() {
    return api.post<ApiResponse<{ clockedOutAt: string }>>("/users/me/clock-out");
  },

  startBreak() {
    return api.post<ApiResponse<{ breakStartedAt: string }>>("/users/me/break/start");
  },

  endBreak() {
    return api.post<ApiResponse<{ breakEndedAt: string }>>("/users/me/break/end");
  },

  getPerformanceStats() {
    return api.get<ApiResponse<{
      jobsCompleted: number;
      avgDurationMinutes: number;
      revenue: number;
      rating: number | null;
    }>>("/users/me/stats");
  },

  updateAvailability(available: boolean) {
    return api.patch<ApiResponse<{ available: boolean }>>("/users/me/availability", { available });
  },
};
