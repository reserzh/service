import {
  uuid,
  varchar,
  integer,
  decimal,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { fieldserviceSchema } from "./pg-schema";
import { tenants } from "./tenants";
import { jobs } from "./jobs";
import { users } from "./users";

export const trackingSessionStatusEnum = fieldserviceSchema.enum("tracking_session_status", [
  "active",
  "completed",
  "expired",
]);

export const trackingSessions = fieldserviceSchema.table(
  "tracking_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    technicianId: uuid("technician_id")
      .notNull()
      .references(() => users.id),
    token: varchar("token", { length: 64 }).notNull(),
    status: trackingSessionStatusEnum("status").default("active").notNull(),
    currentLatitude: decimal("current_latitude", { precision: 10, scale: 7 }),
    currentLongitude: decimal("current_longitude", { precision: 10, scale: 7 }),
    destinationLatitude: decimal("destination_latitude", { precision: 10, scale: 7 }),
    destinationLongitude: decimal("destination_longitude", { precision: 10, scale: 7 }),
    etaMinutes: integer("eta_minutes"),
    lastLocationAt: timestamp("last_location_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("tracking_sessions_token_idx").on(table.token),
    index("tracking_sessions_tenant_job_idx").on(table.tenantId, table.jobId),
    index("tracking_sessions_status_idx").on(table.status),
  ]
);

export const trackingSessionsRelations = relations(trackingSessions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [trackingSessions.tenantId],
    references: [tenants.id],
  }),
  job: one(jobs, {
    fields: [trackingSessions.jobId],
    references: [jobs.id],
  }),
  technician: one(users, {
    fields: [trackingSessions.technicianId],
    references: [users.id],
  }),
}));
