import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
  date,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { customerTypeEnum } from "./enums";
import { tenants } from "./tenants";
import { users } from "./users";

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }).notNull(),
    altPhone: varchar("alt_phone", { length: 50 }),
    companyName: varchar("company_name", { length: 255 }),
    type: customerTypeEnum("type").default("residential").notNull(),
    source: varchar("source", { length: 100 }),
    tags: text("tags").array(),
    notes: text("notes"),
    doNotContact: boolean("do_not_contact").default(false).notNull(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("customers_tenant_id_idx").on(table.tenantId),
    index("customers_tenant_name_idx").on(table.tenantId, table.lastName, table.firstName),
    index("customers_tenant_email_idx").on(table.tenantId, table.email),
    index("customers_tenant_phone_idx").on(table.tenantId, table.phone),
  ]
);

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customers.tenantId],
    references: [tenants.id],
  }),
  createdByUser: one(users, {
    fields: [customers.createdBy],
    references: [users.id],
  }),
  properties: many(properties),
}));

// Properties
export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }),
    addressLine1: varchar("address_line1", { length: 255 }).notNull(),
    addressLine2: varchar("address_line2", { length: 255 }),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 50 }).notNull(),
    zip: varchar("zip", { length: 20 }).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    accessNotes: text("access_notes"),
    isPrimary: boolean("is_primary").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("properties_tenant_id_idx").on(table.tenantId),
    index("properties_customer_id_idx").on(table.tenantId, table.customerId),
  ]
);

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [properties.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [properties.customerId],
    references: [customers.id],
  }),
  equipment: many(equipment),
}));

// Equipment
export const equipment = pgTable(
  "equipment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 100 }).notNull(),
    brand: varchar("brand", { length: 100 }),
    model: varchar("model", { length: 100 }),
    serialNumber: varchar("serial_number", { length: 100 }),
    installDate: date("install_date"),
    warrantyExpiry: date("warranty_expiry"),
    locationInProperty: varchar("location_in_property", { length: 255 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("equipment_tenant_id_idx").on(table.tenantId),
    index("equipment_property_id_idx").on(table.tenantId, table.propertyId),
  ]
);

export const equipmentRelations = relations(equipment, ({ one }) => ({
  tenant: one(tenants, {
    fields: [equipment.tenantId],
    references: [tenants.id],
  }),
  property: one(properties, {
    fields: [equipment.propertyId],
    references: [properties.id],
  }),
  customer: one(customers, {
    fields: [equipment.customerId],
    references: [customers.id],
  }),
}));
