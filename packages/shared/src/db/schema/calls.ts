import {
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import {
  callDirectionEnum,
  callStatusEnum,
  recordingStatusEnum,
  transcriptionStatusEnum,
} from "./enums";
import { tenants } from "./tenants";
import { customers } from "./customers";
import { jobs } from "./jobs";
import { users } from "./users";
import { fieldserviceSchema } from "./pg-schema";

export const calls = fieldserviceSchema.table(
  "calls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    callSid: varchar("call_sid", { length: 64 }).notNull(),
    direction: callDirectionEnum("direction").notNull(),
    fromNumber: varchar("from_number", { length: 50 }).notNull(),
    toNumber: varchar("to_number", { length: 50 }).notNull(),
    status: callStatusEnum("status").default("initiated").notNull(),
    duration: integer("duration"),
    customerId: uuid("customer_id").references(() => customers.id),
    jobId: uuid("job_id").references(() => jobs.id),
    userId: uuid("user_id").references(() => users.id),
    notes: text("notes"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("calls_tenant_idx").on(table.tenantId),
    index("calls_tenant_customer_idx").on(table.tenantId, table.customerId),
    index("calls_tenant_job_idx").on(table.tenantId, table.jobId),
    index("calls_tenant_created_idx").on(table.tenantId, table.createdAt),
    uniqueIndex("calls_call_sid_idx").on(table.callSid),
    index("calls_tenant_from_idx").on(table.tenantId, table.fromNumber),
    index("calls_tenant_to_idx").on(table.tenantId, table.toNumber),
  ]
);

export const callsRelations = relations(calls, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [calls.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [calls.customerId],
    references: [customers.id],
  }),
  job: one(jobs, {
    fields: [calls.jobId],
    references: [jobs.id],
  }),
  user: one(users, {
    fields: [calls.userId],
    references: [users.id],
  }),
  recordings: many(callRecordings),
}));

export const callRecordings = fieldserviceSchema.table(
  "call_recordings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    callId: uuid("call_id")
      .notNull()
      .references(() => calls.id, { onDelete: "cascade" }),
    recordingSid: varchar("recording_sid", { length: 64 }).notNull(),
    duration: integer("duration"),
    recordingUrl: text("recording_url"),
    status: recordingStatusEnum("status").default("processing").notNull(),
    transcriptionText: text("transcription_text"),
    transcriptionStatus: transcriptionStatusEnum("transcription_status").default("none").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("call_recordings_call_idx").on(table.callId),
    uniqueIndex("call_recordings_sid_idx").on(table.recordingSid),
  ]
);

export const callRecordingsRelations = relations(callRecordings, ({ one }) => ({
  tenant: one(tenants, {
    fields: [callRecordings.tenantId],
    references: [tenants.id],
  }),
  call: one(calls, {
    fields: [callRecordings.callId],
    references: [calls.id],
  }),
}));
