import { api } from "../client";
import type { ApiResponse } from "@/types/models";
import type { TradeType } from "@fieldservice/api-types/constants";

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

interface TenantSettingsResponse {
  tradeType?: TradeType;
  operatorType?: "solo" | "crew";
  [key: string]: unknown;
}

interface BrandingResponse {
  companyName: string;
  logoUrl: string | null;
  accentColor: string | null;
}

export const settingsApi = {
  getCompany() {
    return api.get<ApiResponse<CompanyProfile>>("/settings/company");
  },
  getTenantSettings() {
    return api.get<ApiResponse<TenantSettingsResponse>>("/settings");
  },
  getBranding() {
    return api.get<ApiResponse<BrandingResponse>>("/branding");
  },
};
