import { api } from "../client";
import type { ApiResponse } from "@/types/models";

interface CompanyProfile {
  name: string;
  email: string;
  phone: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  timezone: string;
  website: string | null;
  logoUrl: string | null;
}

export const settingsApi = {
  getCompany() {
    return api.get<ApiResponse<CompanyProfile>>("/settings/company");
  },
};
