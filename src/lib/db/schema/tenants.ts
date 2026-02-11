import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { subscriptionStatusEnum } from "./enums";

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  addressLine1: varchar("address_line1", { length: 255 }),
  addressLine2: varchar("address_line2", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zip: varchar("zip", { length: 20 }),
  country: varchar("country", { length: 2 }).default("US").notNull(),
  timezone: varchar("timezone", { length: 50 }).default("America/New_York").notNull(),
  logoUrl: text("logo_url"),
  website: varchar("website", { length: 255 }),
  licenseNumber: varchar("license_number", { length: 100 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeConnectId: varchar("stripe_connect_id", { length: 255 }),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default("trialing").notNull(),
  subscriptionPlan: varchar("subscription_plan", { length: 50 }),
  settings: jsonb("settings").default({}).$type<TenantSettings>(),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export type TenantSettings = {
  defaultTaxRate?: number;
  businessHours?: {
    [day: string]: { open: string; close: string } | null;
  };
  invoiceTerms?: string;
  estimateTerms?: string;
  invoicePrefix?: string;
  estimatePrefix?: string;
  jobPrefix?: string;
};
