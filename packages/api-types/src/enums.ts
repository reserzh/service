// ---- Enum value arrays (single source of truth) ----

export const USER_ROLES = ["admin", "office_manager", "dispatcher", "csr", "technician"] as const;
export const CUSTOMER_TYPES = ["residential", "commercial"] as const;
export const JOB_STATUSES = ["new", "scheduled", "dispatched", "en_route", "in_progress", "completed", "canceled"] as const;
export const JOB_PRIORITIES = ["low", "normal", "high", "emergency"] as const;
export const LINE_ITEM_TYPES = ["service", "material", "labor", "discount", "other"] as const;
export const ESTIMATE_STATUSES = ["draft", "sent", "viewed", "approved", "declined", "expired"] as const;
export const INVOICE_STATUSES = ["draft", "sent", "viewed", "paid", "partial", "overdue", "void"] as const;
export const PAYMENT_METHODS = ["credit_card", "debit_card", "ach", "cash", "check", "other"] as const;
export const PAYMENT_STATUSES = ["pending", "succeeded", "failed", "refunded"] as const;
export const SIGNER_ROLES = ["customer", "technician"] as const;
export const PHOTO_TYPES = ["general", "before", "after"] as const;

// Communication enums
export const COMMUNICATION_TYPES = ["email", "sms"] as const;
export const COMMUNICATION_STATUSES = ["pending", "sent", "delivered", "bounced", "failed"] as const;
export const COMMUNICATION_TRIGGERS = [
  "invoice_sent",
  "estimate_sent",
  "job_scheduled",
  "job_dispatched",
  "tech_en_route",
  "job_completed",
  "appointment_reminder",
  "custom",
] as const;

// Time tracking enums
export const TIME_ENTRY_TYPES = ["clock_in", "clock_out", "break_start", "break_end"] as const;

// Job assignment enums
export const JOB_ASSIGNMENT_ROLES = ["lead", "member"] as const;

// Agreement enums
export const AGREEMENT_STATUSES = ["draft", "active", "paused", "completed", "canceled"] as const;
export const BILLING_FREQUENCIES = ["monthly", "quarterly", "semi_annual", "annual", "one_time"] as const;
export const AGREEMENT_VISIT_STATUSES = ["scheduled", "completed", "skipped", "canceled"] as const;

// Call / Voice enums
export const CALL_DIRECTIONS = ["inbound", "outbound"] as const;
export const CALL_STATUSES = ["initiated", "ringing", "in_progress", "completed", "busy", "no_answer", "failed", "canceled"] as const;
export const RECORDING_STATUSES = ["processing", "completed", "failed", "deleted"] as const;
export const TRANSCRIPTION_STATUSES = ["none", "processing", "completed", "failed"] as const;

// ---- Union types derived from arrays ----

export type UserRole = (typeof USER_ROLES)[number];
export type CustomerType = (typeof CUSTOMER_TYPES)[number];
export type JobStatus = (typeof JOB_STATUSES)[number];
export type JobPriority = (typeof JOB_PRIORITIES)[number];
export type LineItemType = (typeof LINE_ITEM_TYPES)[number];
export type EstimateStatus = (typeof ESTIMATE_STATUSES)[number];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type SignerRole = (typeof SIGNER_ROLES)[number];
export type PhotoType = (typeof PHOTO_TYPES)[number];
export type CommunicationType = (typeof COMMUNICATION_TYPES)[number];
export type CommunicationStatus = (typeof COMMUNICATION_STATUSES)[number];
export type CommunicationTrigger = (typeof COMMUNICATION_TRIGGERS)[number];
export type TimeEntryType = (typeof TIME_ENTRY_TYPES)[number];
export type JobAssignmentRole = (typeof JOB_ASSIGNMENT_ROLES)[number];
export type AgreementStatus = (typeof AGREEMENT_STATUSES)[number];
export type BillingFrequency = (typeof BILLING_FREQUENCIES)[number];
export type AgreementVisitStatus = (typeof AGREEMENT_VISIT_STATUSES)[number];
export type CallDirection = (typeof CALL_DIRECTIONS)[number];
export type CallStatus = (typeof CALL_STATUSES)[number];
export type RecordingStatus = (typeof RECORDING_STATUSES)[number];
export type TranscriptionStatus = (typeof TRANSCRIPTION_STATUSES)[number];
