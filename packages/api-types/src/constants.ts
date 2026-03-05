import type {
  JobStatus,
  JobPriority,
  EstimateStatus,
  InvoiceStatus,
  LineItemType,
  CommunicationTrigger,
  AgreementStatus,
  BillingFrequency,
  AgreementVisitStatus,
  CallDirection,
  CallStatus,
} from "./enums";

// Valid status transitions (authoritative — backend is source of truth)
export const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  new: ["scheduled", "canceled"],
  scheduled: ["dispatched", "new", "canceled"],
  dispatched: ["en_route", "in_progress", "scheduled", "canceled"],
  en_route: ["in_progress", "dispatched", "canceled"],
  in_progress: ["completed", "dispatched", "canceled"],
  completed: [],
  canceled: ["new"],
};

// For technicians, the primary action for each status
export const PRIMARY_NEXT_STATUS: Partial<Record<JobStatus, JobStatus>> = {
  dispatched: "en_route",
  en_route: "in_progress",
  in_progress: "completed",
};

// Status display labels
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  new: "New",
  scheduled: "Scheduled",
  dispatched: "Dispatched",
  en_route: "En Route",
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
  dispatched: "On My Way",
  en_route: "Start Job",
  in_progress: "Complete Job",
};

// Line item type labels
export const LINE_ITEM_TYPE_LABELS: Record<LineItemType, string> = {
  service: "Service",
  material: "Material",
  labor: "Labor",
  discount: "Discount",
  other: "Other",
};

// Communication trigger labels
export const COMMUNICATION_TRIGGER_LABELS: Record<CommunicationTrigger, string> = {
  invoice_sent: "Invoice Sent",
  estimate_sent: "Estimate Sent",
  job_scheduled: "Job Scheduled",
  job_dispatched: "Job Dispatched",
  tech_en_route: "Tech En Route",
  job_completed: "Job Completed",
  appointment_reminder: "Appointment Reminder",
  custom: "Custom",
};

// Agreement status labels
export const AGREEMENT_STATUS_LABELS: Record<AgreementStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  canceled: "Canceled",
};

export const BILLING_FREQUENCY_LABELS: Record<BillingFrequency, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  semi_annual: "Semi-Annual",
  annual: "Annual",
  one_time: "One Time",
};

export const AGREEMENT_VISIT_STATUS_LABELS: Record<AgreementVisitStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  skipped: "Skipped",
  canceled: "Canceled",
};

// Call labels
export const CALL_DIRECTION_LABELS: Record<CallDirection, string> = {
  inbound: "Inbound",
  outbound: "Outbound",
};

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  initiated: "Initiated",
  ringing: "Ringing",
  in_progress: "In Progress",
  completed: "Completed",
  busy: "Busy",
  no_answer: "No Answer",
  failed: "Failed",
  canceled: "Canceled",
};

// Valid agreement status transitions
export const VALID_AGREEMENT_TRANSITIONS: Record<AgreementStatus, AgreementStatus[]> = {
  draft: ["active", "canceled"],
  active: ["paused", "completed", "canceled"],
  paused: ["active", "canceled"],
  completed: [],
  canceled: ["draft"],
};
