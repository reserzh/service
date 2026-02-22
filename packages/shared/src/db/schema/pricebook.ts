import {
  uuid,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { lineItemTypeEnum } from "./enums";
import { tenants } from "./tenants";
import { fieldserviceSchema } from "./pg-schema";

export const pricebookItems = fieldserviceSchema.table(
  "pricebook_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    sku: varchar("sku", { length: 100 }),
    category: varchar("category", { length: 100 }),
    type: lineItemTypeEnum("type").default("service").notNull(),
    unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
    unit: varchar("unit", { length: 50 }),
    costPrice: decimal("cost_price", { precision: 12, scale: 2 }),
    taxable: boolean("taxable").default(true).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("pricebook_items_tenant_idx").on(table.tenantId),
    index("pricebook_items_tenant_category_idx").on(table.tenantId, table.category),
    index("pricebook_items_tenant_active_idx").on(table.tenantId, table.isActive),
    uniqueIndex("pricebook_items_tenant_sku_idx")
      .on(table.tenantId, table.sku)
      .where(sql`${table.sku} IS NOT NULL`),
  ]
);

export const pricebookItemsRelations = relations(pricebookItems, ({ one }) => ({
  tenant: one(tenants, {
    fields: [pricebookItems.tenantId],
    references: [tenants.id],
  }),
}));
