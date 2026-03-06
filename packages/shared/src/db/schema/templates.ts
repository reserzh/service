import {
  uuid,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { lineItemTypeEnum } from "./enums";
import { tenants } from "./tenants";
import { pricebookItems } from "./pricebook";
import { fieldserviceSchema } from "./pg-schema";

// ---- Checklist Templates ----

export const checklistTemplates = fieldserviceSchema.table(
  "checklist_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    jobType: varchar("job_type", { length: 100 }),
    isActive: boolean("is_active").default(true).notNull(),
    autoApplyOnDispatch: boolean("auto_apply_on_dispatch").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("checklist_templates_tenant_idx").on(table.tenantId)]
);

export const checklistTemplatesRelations = relations(checklistTemplates, ({ one, many }) => ({
  tenant: one(tenants, { fields: [checklistTemplates.tenantId], references: [tenants.id] }),
  items: many(checklistTemplateItems),
}));

export const checklistTemplateItems = fieldserviceSchema.table(
  "checklist_template_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    templateId: uuid("template_id")
      .notNull()
      .references(() => checklistTemplates.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 500 }).notNull(),
    groupName: varchar("group_name", { length: 255 }),
    groupSortOrder: integer("group_sort_order").default(0).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("checklist_template_items_template_idx").on(table.tenantId, table.templateId)]
);

export const checklistTemplateItemsRelations = relations(checklistTemplateItems, ({ one }) => ({
  template: one(checklistTemplates, { fields: [checklistTemplateItems.templateId], references: [checklistTemplates.id] }),
}));

// ---- Estimate Templates ----

export const estimateTemplates = fieldserviceSchema.table(
  "estimate_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    summary: varchar("summary", { length: 500 }),
    notes: text("notes"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("estimate_templates_tenant_idx").on(table.tenantId)]
);

export const estimateTemplatesRelations = relations(estimateTemplates, ({ one, many }) => ({
  tenant: one(tenants, { fields: [estimateTemplates.tenantId], references: [tenants.id] }),
  options: many(estimateTemplateOptions),
}));

export const estimateTemplateOptions = fieldserviceSchema.table(
  "estimate_template_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    templateId: uuid("template_id")
      .notNull()
      .references(() => estimateTemplates.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    isRecommended: boolean("is_recommended").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [index("estimate_template_options_template_idx").on(table.tenantId, table.templateId)]
);

export const estimateTemplateOptionsRelations = relations(estimateTemplateOptions, ({ one, many }) => ({
  template: one(estimateTemplates, { fields: [estimateTemplateOptions.templateId], references: [estimateTemplates.id] }),
  items: many(estimateTemplateItems),
}));

export const estimateTemplateItems = fieldserviceSchema.table(
  "estimate_template_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    optionId: uuid("option_id")
      .notNull()
      .references(() => estimateTemplateOptions.id, { onDelete: "cascade" }),
    pricebookItemId: uuid("pricebook_item_id").references(() => pricebookItems.id),
    description: varchar("description", { length: 500 }).notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1").notNull(),
    unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
    type: lineItemTypeEnum("type").default("service").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [index("estimate_template_items_option_idx").on(table.tenantId, table.optionId)]
);

export const estimateTemplateItemsRelations = relations(estimateTemplateItems, ({ one }) => ({
  option: one(estimateTemplateOptions, { fields: [estimateTemplateItems.optionId], references: [estimateTemplateOptions.id] }),
  pricebookItem: one(pricebookItems, { fields: [estimateTemplateItems.pricebookItemId], references: [pricebookItems.id] }),
}));
