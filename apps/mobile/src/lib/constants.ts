export {
  VALID_TRANSITIONS,
  PRIMARY_NEXT_STATUS,
  JOB_STATUS_LABELS,
  JOB_PRIORITY_LABELS,
  ESTIMATE_STATUS_LABELS,
  INVOICE_STATUS_LABELS,
  STATUS_ACTION_LABELS,
} from "@fieldservice/api-types/constants";

// API Configuration
// EXPO_PUBLIC_API_BASE_URL env var overrides the default URL.
// For iOS simulator, localhost works. For physical device, use your machine's local IP.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (__DEV__
    ? "http://localhost:3200/api/v1"
    : "https://app.fieldservicepro.com/api/v1");

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
