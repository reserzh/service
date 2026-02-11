import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  date,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import {
  invoiceStatusEnum,
  lineItemTypeEnum,
  paymentMethodEnum,
  paymentStatusEnum,
} from "./enums";
import { tenants } from "./tenants";
import { users } from "./users";
import { customers } from "./customers";
import { jobs } from "./jobs";
import { estimates } from "./estimates";

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    jobId: uuid("job_id").references(() => jobs.id),
    estimateId: uuid("estimate_id").references(() => estimates.id),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    status: invoiceStatusEnum("status").default("draft").notNull(),
    dueDate: date("due_date").notNull(),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0").notNull(),
    taxRate: decimal("tax_rate", { precision: 5, scale: 4 }).default("0").notNull(),
    taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0").notNull(),
    total: decimal("total", { precision: 12, scale: 2 }).default("0").notNull(),
    amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).default("0").notNull(),
    balanceDue: decimal("balance_due", { precision: 12, scale: 2 }).default("0").notNull(),
    notes: text("notes"),
    internalNotes: text("internal_notes"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("invoices_tenant_status_idx").on(table.tenantId, table.status),
    index("invoices_tenant_customer_idx").on(table.tenantId, table.customerId),
    index("invoices_tenant_number_idx").on(table.tenantId, table.invoiceNumber),
    index("invoices_tenant_due_date_idx").on(table.tenantId, table.dueDate),
  ]
);

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  tenant: one(tenants, { fields: [invoices.tenantId], references: [tenants.id] }),
  customer: one(customers, { fields: [invoices.customerId], references: [customers.id] }),
  job: one(jobs, { fields: [invoices.jobId], references: [jobs.id] }),
  estimate: one(estimates, { fields: [invoices.estimateId], references: [estimates.id] }),
  createdByUser: one(users, { fields: [invoices.createdBy], references: [users.id] }),
  lineItems: many(invoiceLineItems),
  payments: many(payments),
}));

// Invoice Line Items
export const invoiceLineItems = pgTable(
  "invoice_line_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    description: varchar("description", { length: 500 }).notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1").notNull(),
    unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    type: lineItemTypeEnum("type").default("service").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("invoice_line_items_invoice_idx").on(table.tenantId, table.invoiceId),
  ]
);

export const invoiceLineItemsRelations = relations(invoiceLineItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLineItems.invoiceId],
    references: [invoices.id],
  }),
}));

// Payments
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    method: paymentMethodEnum("method").notNull(),
    status: paymentStatusEnum("status").default("pending").notNull(),
    stripePaymentId: varchar("stripe_payment_id", { length: 255 }),
    referenceNumber: varchar("reference_number", { length: 100 }),
    notes: text("notes"),
    processedAt: timestamp("processed_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("payments_tenant_invoice_idx").on(table.tenantId, table.invoiceId),
    index("payments_tenant_customer_idx").on(table.tenantId, table.customerId),
  ]
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, { fields: [payments.invoiceId], references: [invoices.id] }),
  customer: one(customers, { fields: [payments.customerId], references: [customers.id] }),
}));
