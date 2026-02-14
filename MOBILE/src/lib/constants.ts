import type { JobStatus, JobPriority, EstimateStatus, InvoiceStatus } from "@/types/models";

// API Configuration
// For iOS simulator, localhost works. For physical device, use your machine's local IP.
export const API_BASE_URL = __DEV__
  ? "http://localhost:3000/api/v1"
  : "https://app.fieldservicepro.com/api/v1";

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Valid status transitions (mirrors backend jobs.ts:89-96)
export const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  new: ["scheduled", "canceled"],
  scheduled: ["dispatched", "new", "canceled"],
  dispatched: ["in_progress", "scheduled", "canceled"],
  in_progress: ["completed", "dispatched"],
  completed: [],
  canceled: ["new"],
};

// For technicians, the primary action for each status
export const PRIMARY_NEXT_STATUS: Partial<Record<JobStatus, JobStatus>> = {
  dispatched: "in_progress",
  in_progress: "completed",
};

// Status display labels
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  new: "New",
  scheduled: "Scheduled",
  dispatched: "Dispatched",
  in_progress: "In Progress",
  completed: "Completed",
  canceled: "Canceled",
};

export const JOB_PRIORITY_LABELS: Record<JobPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  emergency: "Emergency",
};

export const ESTIMATE_STATUS_LABELS: Record<EstimateStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  approved: "Approved",
  declined: "Declined",
  expired: "Expired",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  paid: "Paid",
  partial: "Partial",
  overdue: "Overdue",
  void: "Void",
};

// Primary action button labels for technicians
export const STATUS_ACTION_LABELS: Partial<Record<JobStatus, string>> = {
  dispatched: "Start Job",
  in_progress: "Complete Job",
};
