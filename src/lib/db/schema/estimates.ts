import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  date,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { estimateStatusEnum, lineItemTypeEnum } from "./enums";
import { tenants } from "./tenants";
import { users } from "./users";
import { customers, properties } from "./customers";
import { jobs } from "./jobs";

export const estimates = pgTable(
  "estimates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    estimateNumber: varchar("estimate_number", { length: 50 }).notNull(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id),
    jobId: uuid("job_id").references(() => jobs.id),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    status: estimateStatusEnum("status").default("draft").notNull(),
    summary: varchar("summary", { length: 500 }).notNull(),
    notes: text("notes"),
    internalNotes: text("internal_notes"),
    validUntil: date("valid_until"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedOptionId: uuid("approved_option_id"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("estimates_tenant_status_idx").on(table.tenantId, table.status),
    index("estimates_tenant_customer_idx").on(table.tenantId, table.customerId),
    index("estimates_tenant_number_idx").on(table.tenantId, table.estimateNumber),
  ]
);

export const estimatesRelations = relations(estimates, ({ one, many }) => ({
  tenant: one(tenants, { fields: [estimates.tenantId], references: [tenants.id] }),
  customer: one(customers, { fields: [estimates.customerId], references: [customers.id] }),
  property: one(properties, { fields: [estimates.propertyId], references: [properties.id] }),
  job: one(jobs, { fields: [estimates.jobId], references: [jobs.id] }),
  createdByUser: one(users, { fields: [estimates.createdBy], references: [users.id] }),
  options: many(estimateOptions),
}));

// Estimate Options (Good / Better / Best)
export const estimateOptions = pgTable(
  "estimate_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    estimateId: uuid("estimate_id")
      .notNull()
      .references(() => estimates.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    total: decimal("total", { precision: 12, scale: 2 }).default("0").notNull(),
    isRecommended: boolean("is_recommended").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("estimate_options_estimate_idx").on(table.tenantId, table.estimateId),
  ]
);

export const estimateOptionsRelations = relations(estimateOptions, ({ one, many }) => ({
  estimate: one(estimates, {
    fields: [estimateOptions.estimateId],
    references: [estimates.id],
  }),
  items: many(estimateOptionItems),
}));

// Estimate Option Items
export const estimateOptionItems = pgTable(
  "estimate_option_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    optionId: uuid("option_id")
      .notNull()
      .references(() => estimateOptions.id, { onDelete: "cascade" }),
    description: varchar("description", { length: 500 }).notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1").notNull(),
    unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    type: lineItemTypeEnum("type").default("service").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("estimate_option_items_option_idx").on(table.tenantId, table.optionId),
  ]
);

export const estimateOptionItemsRelations = relations(estimateOptionItems, ({ one }) => ({
  option: one(estimateOptions, {
    fields: [estimateOptionItems.optionId],
    references: [estimateOptions.id],
  }),
}));
