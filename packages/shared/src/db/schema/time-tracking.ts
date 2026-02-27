import {
  uuid,
  decimal,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { timeEntryTypeEnum } from "./enums";
import { tenants } from "./tenants";
import { users } from "./users";
import { jobs } from "./jobs";
import { fieldserviceSchema } from "./pg-schema";

export const timeEntries = fieldserviceSchema.table(
  "time_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: timeEntryTypeEnum("type").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    jobId: uuid("job_id").references(() => jobs.id),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("time_entries_user_timestamp_idx").on(table.tenantId, table.userId, table.timestamp),
    index("time_entries_timestamp_idx").on(table.tenantId, table.timestamp),
  ]
);

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  tenant: one(tenants, { fields: [timeEntries.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [timeEntries.userId], references: [users.id] }),
  job: one(jobs, { fields: [timeEntries.jobId], references: [jobs.id] }),
}));
