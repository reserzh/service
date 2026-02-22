// ---- Enum value arrays (single source of truth) ----

export const USER_ROLES = ["admin", "office_manager", "dispatcher", "csr", "technician"] as const;
export const CUSTOMER_TYPES = ["residential", "commercial"] as const;
export const JOB_STATUSES = ["new", "scheduled", "dispatched", "in_progress", "completed", "canceled"] as const;
export const JOB_PRIORITIES = ["low", "normal", "high", "emergency"] as const;
export const LINE_ITEM_TYPES = ["service", "material", "labor", "discount", "other"] as const;
export const ESTIMATE_STATUSES = ["draft", "sent", "viewed", "approved", "declined", "expired"] as const;
export const INVOICE_STATUSES = ["draft", "sent", "viewed", "paid", "partial", "overdue", "void"] as const;
export const PAYMENT_METHODS = ["credit_card", "debit_card", "ach", "cash", "check", "other"] as const;
export const PAYMENT_STATUSES = ["pending", "succeeded", "failed", "refunded"] as const;
export const SIGNER_ROLES = ["customer", "technician"] as const;

// Communication enums
export const COMMUNICATION_TYPES = ["email"] as const;
export const COMMUNICATION_STATUSES = ["pending", "sent", "delivered", "bounced", "failed"] as const;
export const COMMUNICATION_TRIGGERS = [
  "invoice_sent",
  "estimate_sent",
  "job_scheduled",
  "job_dispatched",
  "job_completed",
  "appointment_reminder",
  "custom",
] as const;

// Agreement enums
export const AGREEMENT_STATUSES = ["draft", "active", "paused", "completed", "canceled"] as const;
export const BILLING_FREQUENCIES = ["monthly", "quarterly", "semi_annual", "annual", "one_time"] as const;
export const AGREEMENT_VISIT_STATUSES = ["scheduled", "completed", "skipped", "canceled"] as const;

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
export type CommunicationType = (typeof COMMUNICATION_TYPES)[number];
export type CommunicationStatus = (typeof COMMUNICATION_STATUSES)[number];
export type CommunicationTrigger = (typeof COMMUNICATION_TRIGGERS)[number];
export type AgreementStatus = (typeof AGREEMENT_STATUSES)[number];
export type BillingFrequency = (typeof BILLING_FREQUENCIES)[number];
export type AgreementVisitStatus = (typeof AGREEMENT_VISIT_STATUSES)[number];
