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
};
