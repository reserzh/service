import {
  uuid,
  varchar,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants";
import { customers } from "./customers";
import { fieldserviceSchema } from "./pg-schema";

// Customer Portal Tokens (for invite/magic link flows)
export const customerPortalTokens = fieldserviceSchema.table(
  "customer_portal_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("portal_tokens_token_idx").on(table.token),
    index("portal_tokens_tenant_customer_idx").on(table.tenantId, table.customerId),
  ]
);

export const customerPortalTokensRelations = relations(customerPortalTokens, ({ one }) => ({
  tenant: one(tenants, {
    fields: [customerPortalTokens.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [customerPortalTokens.customerId],
    references: [customers.id],
  }),
}));
