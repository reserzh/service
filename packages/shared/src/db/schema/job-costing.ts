import {
  uuid,
  integer,
  decimal,
  text,
  date,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants";
import { users } from "./users";
import { jobs } from "./jobs";
import { fieldserviceSchema } from "./pg-schema";

export const jobDailySnapshots = fieldserviceSchema.table(
  "job_daily_snapshots",
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
    snapshotDate: date("snapshot_date").notNull(),
    completionPercent: integer("completion_percent"),
    laborHours: decimal("labor_hours", { precision: 10, scale: 2 }),
    laborCost: decimal("labor_cost", { precision: 12, scale: 2 }),
    materialCost: decimal("material_cost", { precision: 12, scale: 2 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("job_daily_snapshots_job_idx").on(table.tenantId, table.jobId),
    index("job_daily_snapshots_date_idx").on(table.tenantId, table.jobId, table.snapshotDate),
  ]
);

export const jobDailySnapshotsRelations = relations(jobDailySnapshots, ({ one }) => ({
  tenant: one(tenants, { fields: [jobDailySnapshots.tenantId], references: [tenants.id] }),
  job: one(jobs, { fields: [jobDailySnapshots.jobId], references: [jobs.id] }),
  user: one(users, { fields: [jobDailySnapshots.userId], references: [users.id] }),
}));
