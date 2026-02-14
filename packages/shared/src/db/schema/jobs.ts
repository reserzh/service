import {
  uuid,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import {
  jobStatusEnum,
  jobPriorityEnum,
  lineItemTypeEnum,
  signerRoleEnum,
} from "./enums";
import { tenants } from "./tenants";
import { users } from "./users";
import { customers, properties } from "./customers";
import { fieldserviceSchema } from "./pg-schema";

export const jobs = fieldserviceSchema.table(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    jobNumber: varchar("job_number", { length: 50 }).notNull(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id),
    estimateId: uuid("estimate_id"),
    assignedTo: uuid("assigned_to").references(() => users.id),
    status: jobStatusEnum("status").default("new").notNull(),
    priority: jobPriorityEnum("priority").default("normal").notNull(),
    jobType: varchar("job_type", { length: 100 }).notNull(),
    serviceType: varchar("service_type", { length: 100 }),
    summary: varchar("summary", { length: 500 }).notNull(),
    description: text("description"),
    scheduledStart: timestamp("scheduled_start", { withTimezone: true }),
    scheduledEnd: timestamp("scheduled_end", { withTimezone: true }),
    actualStart: timestamp("actual_start", { withTimezone: true }),
    actualEnd: timestamp("actual_end", { withTimezone: true }),
    dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    tags: text("tags").array(),
    internalNotes: text("internal_notes"),
    customerNotes: text("customer_notes"),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }),
    isRecurring: boolean("is_recurring").default(false).notNull(),
    recurrenceRule: jsonb("recurrence_rule"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("jobs_tenant_status_idx").on(table.tenantId, table.status),
    index("jobs_tenant_assigned_idx").on(table.tenantId, table.assignedTo, table.scheduledStart),
    index("jobs_tenant_customer_idx").on(table.tenantId, table.customerId),
    index("jobs_tenant_number_idx").on(table.tenantId, table.jobNumber),
  ]
);

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  tenant: one(tenants, { fields: [jobs.tenantId], references: [tenants.id] }),
  customer: one(customers, { fields: [jobs.customerId], references: [customers.id] }),
  property: one(properties, { fields: [jobs.propertyId], references: [properties.id] }),
  assignedUser: one(users, { fields: [jobs.assignedTo], references: [users.id] }),
  createdByUser: one(users, { fields: [jobs.createdBy], references: [users.id] }),
  lineItems: many(jobLineItems),
  notes: many(jobNotes),
  photos: many(jobPhotos),
  signatures: many(jobSignatures),
}));

// Job Line Items
export const jobLineItems = fieldserviceSchema.table(
  "job_line_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    description: varchar("description", { length: 500 }).notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1").notNull(),
    unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    type: lineItemTypeEnum("type").default("service").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("job_line_items_job_idx").on(table.tenantId, table.jobId)]
);

export const jobLineItemsRelations = relations(jobLineItems, ({ one }) => ({
  job: one(jobs, { fields: [jobLineItems.jobId], references: [jobs.id] }),
}));

// Job Notes
export const jobNotes = fieldserviceSchema.table(
  "job_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    content: text("content").notNull(),
    isInternal: boolean("is_internal").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("job_notes_job_idx").on(table.tenantId, table.jobId)]
);

export const jobNotesRelations = relations(jobNotes, ({ one }) => ({
  job: one(jobs, { fields: [jobNotes.jobId], references: [jobs.id] }),
  user: one(users, { fields: [jobNotes.userId], references: [users.id] }),
}));

// Job Photos
export const jobPhotos = fieldserviceSchema.table(
  "job_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    storagePath: text("storage_path").notNull(),
    caption: varchar("caption", { length: 255 }),
    takenAt: timestamp("taken_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("job_photos_job_idx").on(table.tenantId, table.jobId)]
);

export const jobPhotosRelations = relations(jobPhotos, ({ one }) => ({
  job: one(jobs, { fields: [jobPhotos.jobId], references: [jobs.id] }),
  user: one(users, { fields: [jobPhotos.userId], references: [users.id] }),
}));

// Job Signatures
export const jobSignatures = fieldserviceSchema.table(
  "job_signatures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    signerName: varchar("signer_name", { length: 255 }).notNull(),
    signerRole: signerRoleEnum("signer_role").notNull(),
    storagePath: text("storage_path").notNull(),
    signedAt: timestamp("signed_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("job_signatures_job_idx").on(table.tenantId, table.jobId)]
);

export const jobSignaturesRelations = relations(jobSignatures, ({ one }) => ({
  job: one(jobs, { fields: [jobSignatures.jobId], references: [jobs.id] }),
}));
