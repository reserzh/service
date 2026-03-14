import {
  uuid,
  text,
  date,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants";
import { users } from "./users";
import { fieldserviceSchema } from "./pg-schema";

export const dailyReports = fieldserviceSchema.table(
  "daily_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    reportDate: date("report_date").notNull(),
    materialRequests: text("material_requests"),
    equipmentIssues: text("equipment_issues"),
    officeNotes: text("office_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("daily_reports_tenant_date_idx").on(table.tenantId, table.reportDate),
    index("daily_reports_tenant_user_idx").on(table.tenantId, table.userId, table.reportDate),
    unique("daily_reports_tenant_user_date_uniq").on(table.tenantId, table.userId, table.reportDate),
  ]
);

export const dailyReportsRelations = relations(dailyReports, ({ one }) => ({
  tenant: one(tenants, { fields: [dailyReports.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [dailyReports.userId], references: [users.id] }),
}));
