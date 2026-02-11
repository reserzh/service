import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  decimal,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { userRoleEnum } from "./enums";
import { tenants } from "./tenants";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(), // matches Supabase Auth user ID
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    role: userRoleEnum("role").default("technician").notNull(),
    avatarUrl: text("avatar_url"),
    isActive: boolean("is_active").default(true).notNull(),
    color: varchar("color", { length: 7 }).default("#3b82f6").notNull(),
    hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
    canBeDispatched: boolean("can_be_dispatched").default(false).notNull(),
    notificationPreferences: jsonb("notification_preferences")
      .default({})
      .$type<NotificationPreferences>(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("users_tenant_id_idx").on(table.tenantId),
    index("users_email_idx").on(table.email),
  ]
);

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}));

export type NotificationPreferences = {
  email?: boolean;
  sms?: boolean;
  push?: boolean;
  jobAssigned?: boolean;
  estimateApproved?: boolean;
  paymentReceived?: boolean;
};
