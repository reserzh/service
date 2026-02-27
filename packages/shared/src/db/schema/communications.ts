import {
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { communicationTypeEnum, communicationStatusEnum } from "./enums";
import { tenants } from "./tenants";
import { users } from "./users";
import { fieldserviceSchema } from "./pg-schema";

// Communication Templates
export const communicationTemplates = fieldserviceSchema.table(
  "communication_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    type: communicationTypeEnum("type").default("email").notNull(),
    trigger: varchar("trigger", { length: 100 }),
    subject: varchar("subject", { length: 500 }).notNull(),
    body: text("body").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("comm_templates_tenant_idx").on(table.tenantId),
    index("comm_templates_tenant_trigger_idx").on(table.tenantId, table.trigger),
  ]
);

export const communicationTemplatesRelations = relations(communicationTemplates, ({ one }) => ({
  tenant: one(tenants, {
    fields: [communicationTemplates.tenantId],
    references: [tenants.id],
  }),
}));

// Communication Log
export const communicationLog = fieldserviceSchema.table(
  "communication_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    templateId: uuid("template_id").references(() => communicationTemplates.id),
    recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
    recipientPhone: varchar("recipient_phone", { length: 50 }),
    recipientName: varchar("recipient_name", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 500 }).notNull(),
    channel: communicationTypeEnum("channel").default("email").notNull(),
    status: communicationStatusEnum("status").default("pending").notNull(),
    entityType: varchar("entity_type", { length: 50 }),
    entityId: uuid("entity_id"),
    sentBy: uuid("sent_by")
      .notNull()
      .references(() => users.id),
    resendMessageId: varchar("resend_message_id", { length: 255 }),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("comm_log_tenant_entity_idx").on(table.tenantId, table.entityType, table.entityId),
    index("comm_log_tenant_sent_idx").on(table.tenantId, table.sentAt),
  ]
);

export const communicationLogRelations = relations(communicationLog, ({ one }) => ({
  tenant: one(tenants, {
    fields: [communicationLog.tenantId],
    references: [tenants.id],
  }),
  template: one(communicationTemplates, {
    fields: [communicationLog.templateId],
    references: [communicationTemplates.id],
  }),
  sentByUser: one(users, {
    fields: [communicationLog.sentBy],
    references: [users.id],
  }),
}));
