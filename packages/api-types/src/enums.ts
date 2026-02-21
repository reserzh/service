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
