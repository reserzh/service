import type { JobStatus, JobPriority, EstimateStatus, InvoiceStatus } from "@/types/models";

// Job status colors — high-contrast for both light and dark modes
export const JOB_STATUS_COLORS: Record<JobStatus, { bg: string; text: string; dot: string }> = {
  new: { bg: "bg-slate-200 dark:bg-slate-900", text: "text-slate-800 dark:text-slate-200", dot: "bg-slate-500 dark:bg-slate-400" },
  scheduled: { bg: "bg-blue-200 dark:bg-blue-900", text: "text-blue-800 dark:text-blue-200", dot: "bg-blue-500 dark:bg-blue-400" },
  dispatched: { bg: "bg-indigo-200 dark:bg-indigo-900", text: "text-indigo-800 dark:text-indigo-200", dot: "bg-indigo-500 dark:bg-indigo-400" },
  en_route: { bg: "bg-violet-200 dark:bg-violet-900", text: "text-violet-800 dark:text-violet-200", dot: "bg-violet-500 dark:bg-violet-400" },
  in_progress: { bg: "bg-amber-200 dark:bg-amber-900", text: "text-amber-800 dark:text-amber-200", dot: "bg-amber-500 dark:bg-amber-400" },
  completed: { bg: "bg-emerald-200 dark:bg-emerald-900", text: "text-emerald-800 dark:text-emerald-200", dot: "bg-emerald-500 dark:bg-emerald-400" },
  canceled: { bg: "bg-red-200 dark:bg-red-900", text: "text-red-800 dark:text-red-200", dot: "bg-red-500 dark:bg-red-400" },
};

// Job priority colors
export const JOB_PRIORITY_COLORS: Record<JobPriority, { bg: string; text: string }> = {
  low: { bg: "bg-slate-200 dark:bg-slate-900", text: "text-slate-800 dark:text-slate-200" },
  normal: { bg: "bg-blue-200 dark:bg-blue-900", text: "text-blue-800 dark:text-blue-200" },
  high: { bg: "bg-orange-200 dark:bg-orange-900", text: "text-orange-800 dark:text-orange-200" },
  emergency: { bg: "bg-red-200 dark:bg-red-900", text: "text-red-800 dark:text-red-200" },
};

// Estimate status colors
export const ESTIMATE_STATUS_COLORS: Record<EstimateStatus, { bg: string; text: string }> = {
  draft: { bg: "bg-slate-200 dark:bg-slate-900", text: "text-slate-800 dark:text-slate-200" },
  sent: { bg: "bg-blue-200 dark:bg-blue-900", text: "text-blue-800 dark:text-blue-200" },
  viewed: { bg: "bg-purple-200 dark:bg-purple-900", text: "text-purple-800 dark:text-purple-200" },
  approved: { bg: "bg-emerald-200 dark:bg-emerald-900", text: "text-emerald-800 dark:text-emerald-200" },
  declined: { bg: "bg-red-200 dark:bg-red-900", text: "text-red-800 dark:text-red-200" },
  expired: { bg: "bg-gray-200 dark:bg-gray-900", text: "text-gray-800 dark:text-gray-200" },
};

// Invoice status colors
export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, { bg: string; text: string }> = {
  draft: { bg: "bg-slate-200 dark:bg-slate-900", text: "text-slate-800 dark:text-slate-200" },
  sent: { bg: "bg-blue-200 dark:bg-blue-900", text: "text-blue-800 dark:text-blue-200" },
  viewed: { bg: "bg-purple-200 dark:bg-purple-900", text: "text-purple-800 dark:text-purple-200" },
  paid: { bg: "bg-emerald-200 dark:bg-emerald-900", text: "text-emerald-800 dark:text-emerald-200" },
  partial: { bg: "bg-amber-200 dark:bg-amber-900", text: "text-amber-800 dark:text-amber-200" },
  overdue: { bg: "bg-red-200 dark:bg-red-900", text: "text-red-800 dark:text-red-200" },
  void: { bg: "bg-gray-200 dark:bg-gray-900", text: "text-gray-800 dark:text-gray-200" },
};

// Status action button colors
export const STATUS_ACTION_COLORS: Partial<Record<JobStatus, string>> = {
  dispatched: "bg-indigo-600",
  en_route: "bg-blue-600",
  in_progress: "bg-emerald-600",
};
