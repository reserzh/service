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
  PHOTO_TYPES,
  TIME_ENTRY_TYPES,
  JOB_ASSIGNMENT_ROLES,
  COMMUNICATION_TYPES,
  COMMUNICATION_STATUSES,
  AGREEMENT_STATUSES,
  BILLING_FREQUENCIES,
  AGREEMENT_VISIT_STATUSES,
  CHECKLIST_TEMPLATE_TYPES,
  CALL_DIRECTIONS,
  CALL_STATUSES,
  RECORDING_STATUSES,
  TRANSCRIPTION_STATUSES,
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
export const photoTypeEnum = fieldserviceSchema.enum("photo_type", [...PHOTO_TYPES]);

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

// Time tracking enums
export const timeEntryTypeEnum = fieldserviceSchema.enum("time_entry_type", [...TIME_ENTRY_TYPES]);

// Job assignment enums
export const jobAssignmentRoleEnum = fieldserviceSchema.enum("job_assignment_role", [...JOB_ASSIGNMENT_ROLES]);

// Checklist template type enums
export const checklistTemplateTypeEnum = fieldserviceSchema.enum("checklist_template_type", [...CHECKLIST_TEMPLATE_TYPES]);

// Communication enums
export const communicationTypeEnum = fieldserviceSchema.enum("communication_type", [...COMMUNICATION_TYPES]);
export const communicationStatusEnum = fieldserviceSchema.enum("communication_status", [...COMMUNICATION_STATUSES]);

// Agreement enums
export const agreementStatusEnum = fieldserviceSchema.enum("agreement_status", [...AGREEMENT_STATUSES]);
export const billingFrequencyEnum = fieldserviceSchema.enum("billing_frequency", [...BILLING_FREQUENCIES]);
export const agreementVisitStatusEnum = fieldserviceSchema.enum("agreement_visit_status", [...AGREEMENT_VISIT_STATUSES]);

// Call / Voice enums
export const callDirectionEnum = fieldserviceSchema.enum("call_direction", [...CALL_DIRECTIONS]);
export const callStatusEnum = fieldserviceSchema.enum("call_status", [...CALL_STATUSES]);
export const recordingStatusEnum = fieldserviceSchema.enum("recording_status", [...RECORDING_STATUSES]);
export const transcriptionStatusEnum = fieldserviceSchema.enum("transcription_status", [...TRANSCRIPTION_STATUSES]);
