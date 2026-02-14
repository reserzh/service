import type { JobStatus, JobPriority, EstimateStatus, InvoiceStatus } from "@/types/models";

// Job status colors
export const JOB_STATUS_COLORS: Record<JobStatus, { bg: string; text: string; dot: string }> = {
  new: { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400" },
  scheduled: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  dispatched: { bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" },
  in_progress: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  completed: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  canceled: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-400" },
};

// Job priority colors
export const JOB_PRIORITY_COLORS: Record<JobPriority, { bg: string; text: string }> = {
  low: { bg: "bg-slate-100", text: "text-slate-600" },
  normal: { bg: "bg-blue-100", text: "text-blue-700" },
  high: { bg: "bg-orange-100", text: "text-orange-700" },
  emergency: { bg: "bg-red-100", text: "text-red-700" },
};

// Estimate status colors
export const ESTIMATE_STATUS_COLORS: Record<EstimateStatus, { bg: string; text: string }> = {
  draft: { bg: "bg-slate-100", text: "text-slate-700" },
  sent: { bg: "bg-blue-100", text: "text-blue-700" },
  viewed: { bg: "bg-purple-100", text: "text-purple-700" },
  approved: { bg: "bg-emerald-100", text: "text-emerald-700" },
  declined: { bg: "bg-red-100", text: "text-red-700" },
  expired: { bg: "bg-gray-100", text: "text-gray-500" },
};

// Invoice status colors
export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, { bg: string; text: string }> = {
  draft: { bg: "bg-slate-100", text: "text-slate-700" },
  sent: { bg: "bg-blue-100", text: "text-blue-700" },
  viewed: { bg: "bg-purple-100", text: "text-purple-700" },
  paid: { bg: "bg-emerald-100", text: "text-emerald-700" },
  partial: { bg: "bg-amber-100", text: "text-amber-700" },
  overdue: { bg: "bg-red-100", text: "text-red-700" },
  void: { bg: "bg-gray-100", text: "text-gray-500" },
};

// Status action button colors
export const STATUS_ACTION_COLORS: Partial<Record<JobStatus, string>> = {
  dispatched: "bg-blue-600",
  in_progress: "bg-emerald-600",
};
