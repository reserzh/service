import { fieldserviceSchema } from "./pg-schema";
import {
  USER_ROLES,
  CUSTOMER_TYPES,
  JOB_STATUSES,
  JOB_PRIORITIES,
  LINE_ITEM_TYPES,
  ESTIMATE_STATUSES,
  INVOICE_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  SIGNER_ROLES,
} from "@fieldservice/api-types/enums";

export const subscriptionStatusEnum = fieldserviceSchema.enum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
]);

export const userRoleEnum = fieldserviceSchema.enum("user_role", [...USER_ROLES]);
export const customerTypeEnum = fieldserviceSchema.enum("customer_type", [...CUSTOMER_TYPES]);
export const jobStatusEnum = fieldserviceSchema.enum("job_status", [...JOB_STATUSES]);
export const jobPriorityEnum = fieldserviceSchema.enum("job_priority", [...JOB_PRIORITIES]);
export const lineItemTypeEnum = fieldserviceSchema.enum("line_item_type", [...LINE_ITEM_TYPES]);
export const estimateStatusEnum = fieldserviceSchema.enum("estimate_status", [...ESTIMATE_STATUSES]);
export const invoiceStatusEnum = fieldserviceSchema.enum("invoice_status", [...INVOICE_STATUSES]);
export const paymentMethodEnum = fieldserviceSchema.enum("payment_method", [...PAYMENT_METHODS]);
export const paymentStatusEnum = fieldserviceSchema.enum("payment_status", [...PAYMENT_STATUSES]);
export const signerRoleEnum = fieldserviceSchema.enum("signer_role", [...SIGNER_ROLES]);

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
