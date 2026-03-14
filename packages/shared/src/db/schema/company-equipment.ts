import {
  uuid,
  varchar,
  text,
  integer,
  decimal,
  date,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants";
import { users } from "./users";
import { fieldserviceSchema } from "./pg-schema";

export const companyEquipment = fieldserviceSchema.table(
  "company_equipment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 100 }).notNull(),
    serialNumber: varchar("serial_number", { length: 100 }),
    brand: varchar("brand", { length: 100 }),
    model: varchar("model", { length: 100 }),
    purchaseDate: date("purchase_date"),
    purchaseCost: decimal("purchase_cost", { precision: 12, scale: 2 }),
    lastServiceDate: date("last_service_date"),
    nextServiceDue: date("next_service_due"),
    hoursUsed: integer("hours_used").default(0),
    status: varchar("status", { length: 50 }).default("available").notNull(),
    assignedTo: uuid("assigned_to").references(() => users.id),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("company_equipment_tenant_idx").on(table.tenantId),
    index("company_equipment_tenant_status_idx").on(table.tenantId, table.status),
  ]
);

export const companyEquipmentRelations = relations(companyEquipment, ({ one, many }) => ({
  tenant: one(tenants, { fields: [companyEquipment.tenantId], references: [tenants.id] }),
  assignedUser: one(users, { fields: [companyEquipment.assignedTo], references: [users.id] }),
  maintenanceLogs: many(equipmentMaintenanceLog),
}));

export const equipmentMaintenanceLog = fieldserviceSchema.table(
  "equipment_maintenance_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    equipmentId: uuid("equipment_id")
      .notNull()
      .references(() => companyEquipment.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 100 }).notNull(),
    description: text("description"),
    cost: decimal("cost", { precision: 12, scale: 2 }),
    performedBy: uuid("performed_by").references(() => users.id),
    performedAt: date("performed_at").notNull(),
    hoursAtService: integer("hours_at_service"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("equipment_maintenance_log_equipment_idx").on(table.tenantId, table.equipmentId),
  ]
);

export const equipmentMaintenanceLogRelations = relations(equipmentMaintenanceLog, ({ one }) => ({
  equipment: one(companyEquipment, { fields: [equipmentMaintenanceLog.equipmentId], references: [companyEquipment.id] }),
  performedByUser: one(users, { fields: [equipmentMaintenanceLog.performedBy], references: [users.id] }),
}));
