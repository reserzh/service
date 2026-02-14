import {
  uuid,
  varchar,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import {
  pageStatusEnum,
  sectionTypeEnum,
  domainStatusEnum,
  bookingStatusEnum,
} from "./enums";
import { tenants } from "./tenants";
import { customers } from "./customers";
import { jobs } from "./jobs";
import { fieldserviceSchema } from "./pg-schema";
import type {
  SiteTheme,
  SiteBranding,
  SiteSeoDefaults,
  SiteSocialLinks,
  SiteAnalytics,
  PageSeo,
  SectionContent,
  SectionSettings,
} from "../../types";

// ─── Site Settings ─────────────────────────────────────────────

export const siteSettings = fieldserviceSchema.table("site_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" })
    .unique(),
  isPublished: boolean("is_published").default(false).notNull(),
  subdomainSlug: varchar("subdomain_slug", { length: 100 }).notNull(),
  theme: jsonb("theme").$type<SiteTheme>(),
  branding: jsonb("branding").$type<SiteBranding>(),
  seoDefaults: jsonb("seo_defaults").$type<SiteSeoDefaults>(),
  socialLinks: jsonb("social_links").$type<SiteSocialLinks>(),
  analytics: jsonb("analytics").$type<SiteAnalytics>(),
  customCss: text("custom_css"),
  templateId: varchar("template_id", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const siteSettingsRelations = relations(siteSettings, ({ one }) => ({
  tenant: one(tenants, {
    fields: [siteSettings.tenantId],
    references: [tenants.id],
  }),
}));

// ─── Site Domains ──────────────────────────────────────────────

export const siteDomains = fieldserviceSchema.table(
  "site_domains",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    domain: varchar("domain", { length: 255 }).notNull(),
    status: domainStatusEnum("status").default("pending_verification").notNull(),
    verificationToken: varchar("verification_token", { length: 255 }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    isPrimary: boolean("is_primary").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("site_domains_tenant_id_idx").on(table.tenantId),
    uniqueIndex("site_domains_domain_idx").on(table.domain),
  ]
);

export const siteDomainsRelations = relations(siteDomains, ({ one }) => ({
  tenant: one(tenants, {
    fields: [siteDomains.tenantId],
    references: [tenants.id],
  }),
}));

// ─── Site Pages ────────────────────────────────────────────────

export const sitePages = fieldserviceSchema.table(
  "site_pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    status: pageStatusEnum("status").default("draft").notNull(),
    isHomepage: boolean("is_homepage").default(false).notNull(),
    seo: jsonb("seo").$type<PageSeo>(),
    sortOrder: integer("sort_order").default(0).notNull(),
    showInNav: boolean("show_in_nav").default(true).notNull(),
    navLabel: varchar("nav_label", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("site_pages_tenant_slug_idx").on(table.tenantId, table.slug),
    index("site_pages_tenant_status_idx").on(table.tenantId, table.status),
  ]
);

export const sitePagesRelations = relations(sitePages, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [sitePages.tenantId],
    references: [tenants.id],
  }),
  sections: many(siteSections),
}));

// ─── Site Sections ─────────────────────────────────────────────

export const siteSections = fieldserviceSchema.table(
  "site_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    pageId: uuid("page_id")
      .notNull()
      .references(() => sitePages.id, { onDelete: "cascade" }),
    type: sectionTypeEnum("type").notNull(),
    content: jsonb("content").$type<SectionContent>(),
    settings: jsonb("settings").$type<SectionSettings>(),
    sortOrder: integer("sort_order").default(0).notNull(),
    isVisible: boolean("is_visible").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("site_sections_tenant_page_idx").on(table.tenantId, table.pageId),
  ]
);

export const siteSectionsRelations = relations(siteSections, ({ one }) => ({
  tenant: one(tenants, {
    fields: [siteSections.tenantId],
    references: [tenants.id],
  }),
  page: one(sitePages, {
    fields: [siteSections.pageId],
    references: [sitePages.id],
  }),
}));

// ─── Site Media ────────────────────────────────────────────────

export const siteMedia = fieldserviceSchema.table(
  "site_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    filename: varchar("filename", { length: 255 }).notNull(),
    storagePath: text("storage_path").notNull(),
    url: text("url").notNull(),
    mimeType: varchar("mime_type", { length: 100 }),
    sizeBytes: integer("size_bytes"),
    altText: varchar("alt_text", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("site_media_tenant_id_idx").on(table.tenantId),
  ]
);

export const siteMediaRelations = relations(siteMedia, ({ one }) => ({
  tenant: one(tenants, {
    fields: [siteMedia.tenantId],
    references: [tenants.id],
  }),
}));

// ─── Service Catalog ───────────────────────────────────────────

export const serviceCatalog = fieldserviceSchema.table(
  "service_catalog",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    shortDescription: varchar("short_description", { length: 500 }),
    icon: varchar("icon", { length: 50 }),
    imageUrl: text("image_url"),
    priceDisplay: varchar("price_display", { length: 100 }),
    isBookable: boolean("is_bookable").default(true).notNull(),
    estimatedDuration: integer("estimated_duration"),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("service_catalog_tenant_slug_idx").on(table.tenantId, table.slug),
    index("service_catalog_tenant_active_idx").on(table.tenantId, table.isActive),
  ]
);

export const serviceCatalogRelations = relations(serviceCatalog, ({ one }) => ({
  tenant: one(tenants, {
    fields: [serviceCatalog.tenantId],
    references: [tenants.id],
  }),
}));

// ─── Booking Requests ──────────────────────────────────────────

export const bookingRequests = fieldserviceSchema.table(
  "booking_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").references(() => serviceCatalog.id),
    status: bookingStatusEnum("status").default("pending").notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    addressLine1: varchar("address_line1", { length: 255 }),
    addressLine2: varchar("address_line2", { length: 255 }),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 50 }),
    zip: varchar("zip", { length: 20 }),
    preferredDate: date("preferred_date"),
    preferredTimeSlot: varchar("preferred_time_slot", { length: 50 }),
    message: text("message"),
    convertedJobId: uuid("converted_job_id").references(() => jobs.id),
    convertedCustomerId: uuid("converted_customer_id").references(() => customers.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("booking_requests_tenant_status_idx").on(table.tenantId, table.status),
    index("booking_requests_tenant_created_idx").on(table.tenantId, table.createdAt),
  ]
);

export const bookingRequestsRelations = relations(bookingRequests, ({ one }) => ({
  tenant: one(tenants, {
    fields: [bookingRequests.tenantId],
    references: [tenants.id],
  }),
  service: one(serviceCatalog, {
    fields: [bookingRequests.serviceId],
    references: [serviceCatalog.id],
  }),
  convertedJob: one(jobs, {
    fields: [bookingRequests.convertedJobId],
    references: [jobs.id],
  }),
  convertedCustomer: one(customers, {
    fields: [bookingRequests.convertedCustomerId],
    references: [customers.id],
  }),
}));
