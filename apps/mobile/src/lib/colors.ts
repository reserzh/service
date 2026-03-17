import type { JobStatus, JobPriority, EstimateStatus, InvoiceStatus } from "@/types/models";

// Signal design — high-visibility color system
// Uses warm stone palette with orange accent for outdoor readability

// Job status colors — bold, high-contrast for sunlight visibility
export const JOB_STATUS_COLORS: Record<JobStatus, { bg: string; text: string; dot: string }> = {
  new: { bg: "bg-stone-200 dark:bg-stone-800", text: "text-stone-800 dark:text-stone-200", dot: "bg-stone-500 dark:bg-stone-400" },
  scheduled: { bg: "bg-orange-100 dark:bg-orange-950", text: "text-orange-800 dark:text-orange-300", dot: "bg-orange-500 dark:bg-orange-400" },
  dispatched: { bg: "bg-amber-100 dark:bg-amber-950", text: "text-amber-800 dark:text-amber-300", dot: "bg-amber-500 dark:bg-amber-400" },
  en_route: { bg: "bg-blue-100 dark:bg-blue-950", text: "text-blue-800 dark:text-blue-300", dot: "bg-blue-500 dark:bg-blue-400" },
  in_progress: { bg: "bg-orange-200 dark:bg-orange-900", text: "text-orange-900 dark:text-orange-200", dot: "bg-orange-600 dark:bg-orange-400" },
  completed: { bg: "bg-emerald-100 dark:bg-emerald-950", text: "text-emerald-800 dark:text-emerald-300", dot: "bg-emerald-500 dark:bg-emerald-400" },
  canceled: { bg: "bg-red-100 dark:bg-red-950", text: "text-red-800 dark:text-red-300", dot: "bg-red-500 dark:bg-red-400" },
};

// Job priority colors
export const JOB_PRIORITY_COLORS: Record<JobPriority, { bg: string; text: string }> = {
  low: { bg: "bg-stone-200 dark:bg-stone-800", text: "text-stone-700 dark:text-stone-300" },
  normal: { bg: "bg-orange-100 dark:bg-orange-950", text: "text-orange-800 dark:text-orange-300" },
  high: { bg: "bg-red-100 dark:bg-red-950", text: "text-red-800 dark:text-red-300" },
  emergency: { bg: "bg-red-200 dark:bg-red-900", text: "text-red-900 dark:text-red-200" },
};

// Estimate status colors
export const ESTIMATE_STATUS_COLORS: Record<EstimateStatus, { bg: string; text: string }> = {
  draft: { bg: "bg-stone-200 dark:bg-stone-800", text: "text-stone-700 dark:text-stone-300" },
  sent: { bg: "bg-orange-100 dark:bg-orange-950", text: "text-orange-800 dark:text-orange-300" },
  viewed: { bg: "bg-amber-100 dark:bg-amber-950", text: "text-amber-800 dark:text-amber-300" },
  approved: { bg: "bg-emerald-100 dark:bg-emerald-950", text: "text-emerald-800 dark:text-emerald-300" },
  declined: { bg: "bg-red-100 dark:bg-red-950", text: "text-red-800 dark:text-red-300" },
  expired: { bg: "bg-stone-200 dark:bg-stone-800", text: "text-stone-600 dark:text-stone-400" },
};

// Invoice status colors
export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, { bg: string; text: string }> = {
  draft: { bg: "bg-stone-200 dark:bg-stone-800", text: "text-stone-700 dark:text-stone-300" },
  sent: { bg: "bg-orange-100 dark:bg-orange-950", text: "text-orange-800 dark:text-orange-300" },
  viewed: { bg: "bg-amber-100 dark:bg-amber-950", text: "text-amber-800 dark:text-amber-300" },
  paid: { bg: "bg-emerald-100 dark:bg-emerald-950", text: "text-emerald-800 dark:text-emerald-300" },
  partial: { bg: "bg-orange-200 dark:bg-orange-900", text: "text-orange-900 dark:text-orange-200" },
  overdue: { bg: "bg-red-100 dark:bg-red-950", text: "text-red-800 dark:text-red-300" },
  void: { bg: "bg-stone-200 dark:bg-stone-800", text: "text-stone-600 dark:text-stone-400" },
};

// Status action button colors — Signal orange/warm palette
export const STATUS_ACTION_COLORS: Partial<Record<JobStatus, string>> = {
  dispatched: "bg-amber-600",
  en_route: "bg-orange-600",
  in_progress: "bg-emerald-600",
};
