import {
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants";
import { users } from "./users";
import { fieldserviceSchema } from "./pg-schema";

// ---------------------------------------------------------------------------
// qb_connections — one per tenant, stores OAuth credentials
// ---------------------------------------------------------------------------
export const qbConnections = fieldserviceSchema.table(
  "qb_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    realmId: varchar("realm_id", { length: 50 }).notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }).notNull(),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }).notNull(),
    companyName: varchar("company_name", { length: 255 }),
    isActive: boolean("is_active").default(true).notNull(),
    connectedBy: uuid("connected_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("qb_connections_tenant_id_idx").on(table.tenantId),
  ]
);

export const qbConnectionsRelations = relations(qbConnections, ({ one }) => ({
  tenant: one(tenants, {
    fields: [qbConnections.tenantId],
    references: [tenants.id],
  }),
  connectedByUser: one(users, {
    fields: [qbConnections.connectedBy],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// qb_entity_mappings — local ID ↔ QB ID mapping
// ---------------------------------------------------------------------------
export const qbEntityMappings = fieldserviceSchema.table(
  "qb_entity_mappings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    localEntityId: uuid("local_entity_id").notNull(),
    qbEntityId: varchar("qb_entity_id", { length: 100 }).notNull(),
    qbSyncToken: varchar("qb_sync_token", { length: 50 }),
    lastSyncStatus: varchar("last_sync_status", { length: 20 }).default("success").notNull(),
    lastSyncError: text("last_sync_error"),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("qb_entity_mappings_unique_idx").on(
      table.tenantId,
      table.entityType,
      table.localEntityId
    ),
    index("qb_entity_mappings_tenant_type_idx").on(table.tenantId, table.entityType),
  ]
);

export const qbEntityMappingsRelations = relations(qbEntityMappings, ({ one }) => ({
  tenant: one(tenants, {
    fields: [qbEntityMappings.tenantId],
    references: [tenants.id],
  }),
}));

// ---------------------------------------------------------------------------
// qb_sync_log — audit trail for every sync operation
// ---------------------------------------------------------------------------
export const qbSyncLog = fieldserviceSchema.table(
  "qb_sync_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    localEntityId: uuid("local_entity_id").notNull(),
    qbEntityId: varchar("qb_entity_id", { length: 100 }),
    operation: varchar("operation", { length: 20 }).notNull(),
    status: varchar("status", { length: 20 }).notNull(),
    requestPayload: text("request_payload"),
    responsePayload: text("response_payload"),
    errorMessage: text("error_message"),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("qb_sync_log_tenant_idx").on(table.tenantId),
    index("qb_sync_log_tenant_entity_idx").on(table.tenantId, table.entityType, table.localEntityId),
    index("qb_sync_log_tenant_status_idx").on(table.tenantId, table.status),
    index("qb_sync_log_created_idx").on(table.createdAt),
  ]
);

export const qbSyncLogRelations = relations(qbSyncLog, ({ one }) => ({
  tenant: one(tenants, {
    fields: [qbSyncLog.tenantId],
    references: [tenants.id],
  }),
}));
