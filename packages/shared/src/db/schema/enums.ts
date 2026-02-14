import { fieldserviceSchema } from "./pg-schema";

export const subscriptionStatusEnum = fieldserviceSchema.enum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
]);

export const userRoleEnum = fieldserviceSchema.enum("user_role", [
  "admin",
  "office_manager",
  "dispatcher",
  "csr",
  "technician",
]);

export const customerTypeEnum = fieldserviceSchema.enum("customer_type", [
  "residential",
  "commercial",
]);

export const jobStatusEnum = fieldserviceSchema.enum("job_status", [
  "new",
  "scheduled",
  "dispatched",
  "in_progress",
  "completed",
  "canceled",
]);

export const jobPriorityEnum = fieldserviceSchema.enum("job_priority", [
  "low",
  "normal",
  "high",
  "emergency",
]);

export const lineItemTypeEnum = fieldserviceSchema.enum("line_item_type", [
  "service",
  "material",
  "labor",
  "discount",
  "other",
]);

export const estimateStatusEnum = fieldserviceSchema.enum("estimate_status", [
  "draft",
  "sent",
  "viewed",
  "approved",
  "declined",
  "expired",
]);

export const invoiceStatusEnum = fieldserviceSchema.enum("invoice_status", [
  "draft",
  "sent",
  "viewed",
  "paid",
  "partial",
  "overdue",
  "void",
]);

export const paymentMethodEnum = fieldserviceSchema.enum("payment_method", [
  "credit_card",
  "debit_card",
  "ach",
  "cash",
  "check",
  "other",
]);

export const paymentStatusEnum = fieldserviceSchema.enum("payment_status", [
  "pending",
  "succeeded",
  "failed",
  "refunded",
]);

export const signerRoleEnum = fieldserviceSchema.enum("signer_role", [
  "customer",
  "technician",
]);

// Website / CMS enums
export const pageStatusEnum = fieldserviceSchema.enum("page_status", [
  "draft",
  "published",
  "archived",
]);

export const sectionTypeEnum = fieldserviceSchema.enum("section_type", [
  "hero",
  "services",
  "about",
  "testimonials",
  "gallery",
  "contact_form",
  "booking_widget",
  "cta_banner",
  "faq",
  "team",
  "map",
  "custom_html",
  "features",
  "pricing",
]);

export const domainStatusEnum = fieldserviceSchema.enum("domain_status", [
  "pending_verification",
  "active",
  "failed",
  "removed",
]);

export const bookingStatusEnum = fieldserviceSchema.enum("booking_status", [
  "pending",
  "confirmed",
  "canceled",
]);
