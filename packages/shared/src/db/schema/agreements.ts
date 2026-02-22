import {
  uuid,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  date,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import {
  agreementStatusEnum,
  billingFrequencyEnum,
  agreementVisitStatusEnum,
} from "./enums";
import { tenants } from "./tenants";
import { users } from "./users";
import { customers, properties } from "./customers";
import { jobs } from "./jobs";
import { invoices } from "./invoices";
import { pricebookItems } from "./pricebook";
import { fieldserviceSchema } from "./pg-schema";

// Agreements
export const agreements = fieldserviceSchema.table(
  "agreements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    agreementNumber: varchar("agreement_number", { length: 50 }).notNull(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id),
    status: agreementStatusEnum("status").default("draft").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    billingFrequency: billingFrequencyEnum("billing_frequency").default("annual").notNull(),
    billingAmount: decimal("billing_amount", { precision: 12, scale: 2 }).notNull(),
    totalValue: decimal("total_value", { precision: 12, scale: 2 }).notNull(),
    visitsPerYear: integer("visits_per_year").default(1).notNull(),
    autoRenew: boolean("auto_renew").default(false).notNull(),
    renewalReminderDays: integer("renewal_reminder_days").default(30).notNull(),
    notes: text("notes"),
    internalNotes: text("internal_notes"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    pausedAt: timestamp("paused_at", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("agreements_tenant_status_idx").on(table.tenantId, table.status),
    index("agreements_tenant_customer_idx").on(table.tenantId, table.customerId),
    uniqueIndex("agreements_tenant_number_idx").on(table.tenantId, table.agreementNumber),
    index("agreements_tenant_end_date_idx").on(table.tenantId, table.endDate),
  ]
);

export const agreementsRelations = relations(agreements, ({ one, many }) => ({
  tenant: one(tenants, { fields: [agreements.tenantId], references: [tenants.id] }),
  customer: one(customers, { fields: [agreements.customerId], references: [customers.id] }),
  property: one(properties, { fields: [agreements.propertyId], references: [properties.id] }),
  createdByUser: one(users, { fields: [agreements.createdBy], references: [users.id] }),
  services: many(agreementServices),
  visits: many(agreementVisits),
}));

// Agreement Services (line items included in the agreement)
export const agreementServices = fieldserviceSchema.table(
  "agreement_services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    agreementId: uuid("agreement_id")
      .notNull()
      .references(() => agreements.id, { onDelete: "cascade" }),
    pricebookItemId: uuid("pricebook_item_id").references(() => pricebookItems.id),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1").notNull(),
    unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [
    index("agreement_services_agreement_idx").on(table.tenantId, table.agreementId),
  ]
);

export const agreementServicesRelations = relations(agreementServices, ({ one }) => ({
  agreement: one(agreements, {
    fields: [agreementServices.agreementId],
    references: [agreements.id],
  }),
  pricebookItem: one(pricebookItems, {
    fields: [agreementServices.pricebookItemId],
    references: [pricebookItems.id],
  }),
}));

// Agreement Visits (scheduled/completed visits)
export const agreementVisits = fieldserviceSchema.table(
  "agreement_visits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    agreementId: uuid("agreement_id")
      .notNull()
      .references(() => agreements.id, { onDelete: "cascade" }),
    visitNumber: integer("visit_number").notNull(),
    status: agreementVisitStatusEnum("status").default("scheduled").notNull(),
    scheduledDate: date("scheduled_date"),
    completedDate: date("completed_date"),
    jobId: uuid("job_id").references(() => jobs.id),
    invoiceId: uuid("invoice_id").references(() => invoices.id),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("agreement_visits_agreement_idx").on(table.tenantId, table.agreementId),
    index("agreement_visits_job_idx").on(table.tenantId, table.jobId),
  ]
);

export const agreementVisitsRelations = relations(agreementVisits, ({ one }) => ({
  agreement: one(agreements, {
    fields: [agreementVisits.agreementId],
    references: [agreements.id],
  }),
  job: one(jobs, {
    fields: [agreementVisits.jobId],
    references: [jobs.id],
  }),
  invoice: one(invoices, {
    fields: [agreementVisits.invoiceId],
    references: [invoices.id],
  }),
}));
