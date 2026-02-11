import { pgEnum } from "drizzle-orm/pg-core";

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
]);

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "office_manager",
  "dispatcher",
  "csr",
  "technician",
]);

export const customerTypeEnum = pgEnum("customer_type", [
  "residential",
  "commercial",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "new",
  "scheduled",
  "dispatched",
  "in_progress",
  "completed",
  "canceled",
]);

export const jobPriorityEnum = pgEnum("job_priority", [
  "low",
  "normal",
  "high",
  "emergency",
]);

export const lineItemTypeEnum = pgEnum("line_item_type", [
  "service",
  "material",
  "labor",
  "discount",
  "other",
]);

export const estimateStatusEnum = pgEnum("estimate_status", [
  "draft",
  "sent",
  "viewed",
  "approved",
  "declined",
  "expired",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "viewed",
  "paid",
  "partial",
  "overdue",
  "void",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "credit_card",
  "debit_card",
  "ach",
  "cash",
  "check",
  "other",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "failed",
  "refunded",
]);

export const signerRoleEnum = pgEnum("signer_role", [
  "customer",
  "technician",
]);
