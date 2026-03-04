import { fieldserviceSchema } from "./pg-schema";
import { uuid, text, timestamp, jsonb, boolean, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants";
import { users } from "./users";
import { aiConversations } from "./ai";

// ==================== User Dashboard Layouts ====================

export const userDashboardLayouts = fieldserviceSchema.table(
  "user_dashboard_layouts",
  {
    id: uuid().defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    widgetOrder: jsonb("widget_order").$type<string[]>().notNull().default([]),
    widgetSizes: jsonb("widget_sizes")
      .$type<Record<string, "full" | "half">>()
      .notNull()
      .default({}),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("user_dashboard_layouts_tenant_user_uniq").on(table.tenantId, table.userId),
    index("user_dashboard_layouts_tenant_user_idx").on(table.tenantId, table.userId),
  ]
);

export const userDashboardLayoutsRelations = relations(
  userDashboardLayouts,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [userDashboardLayouts.tenantId],
      references: [tenants.id],
    }),
    user: one(users, {
      fields: [userDashboardLayouts.userId],
      references: [users.id],
    }),
  })
);

// ==================== AI Dashboard Widgets ====================

export const aiDashboardWidgets = fieldserviceSchema.table(
  "ai_dashboard_widgets",
  {
    id: uuid().defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").references(
      () => aiConversations.id,
      { onDelete: "set null" }
    ),
    title: text().notNull(),
    widgetConfig: jsonb("widget_config")
      .$type<{
        chartType: "bar" | "line" | "area" | "pie";
        xKey?: string;
        yKey?: string;
        nameKey?: string;
        valueKey?: string;
      }>()
      .notNull(),
    queryDefinition: jsonb("query_definition")
      .$type<{
        tools: Array<{ name: string; params: Record<string, unknown> }>;
        prompt: string;
      }>()
      .notNull(),
    cachedData: jsonb("cached_data").$type<Record<string, unknown>>(),
    lastRefreshedAt: timestamp("last_refreshed_at").defaultNow(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("ai_dashboard_widgets_tenant_user_idx").on(table.tenantId, table.userId),
    index("ai_dashboard_widgets_active_idx").on(table.tenantId, table.userId, table.isActive),
  ]
);

export const aiDashboardWidgetsRelations = relations(
  aiDashboardWidgets,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [aiDashboardWidgets.tenantId],
      references: [tenants.id],
    }),
    user: one(users, {
      fields: [aiDashboardWidgets.userId],
      references: [users.id],
    }),
    conversation: one(aiConversations, {
      fields: [aiDashboardWidgets.conversationId],
      references: [aiConversations.id],
    }),
  })
);

// ==================== AI Custom Reports ====================

export const aiCustomReports = fieldserviceSchema.table(
  "ai_custom_reports",
  {
    id: uuid().defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").references(
      () => aiConversations.id,
      { onDelete: "set null" }
    ),
    title: text().notNull(),
    description: text(),
    reportConfig: jsonb("report_config")
      .$type<{
        charts: Array<{
          type: "bar" | "line" | "area" | "pie";
          title: string;
          xKey?: string;
          yKey?: string;
          nameKey?: string;
          valueKey?: string;
          data: Record<string, unknown>[];
        }>;
        tables: Array<{
          title: string;
          columns: string[];
          rows: string[][];
        }>;
      }>()
      .notNull(),
    queryDefinition: jsonb("query_definition")
      .$type<{
        tools: Array<{ name: string; params: Record<string, unknown> }>;
        prompt: string;
      }>()
      .notNull(),
    cachedData: jsonb("cached_data").$type<Record<string, unknown>>(),
    lastRefreshedAt: timestamp("last_refreshed_at").defaultNow(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("ai_custom_reports_tenant_user_idx").on(table.tenantId, table.userId),
    index("ai_custom_reports_active_idx").on(table.tenantId, table.userId, table.isActive),
  ]
);

export const aiCustomReportsRelations = relations(
  aiCustomReports,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [aiCustomReports.tenantId],
      references: [tenants.id],
    }),
    user: one(users, {
      fields: [aiCustomReports.userId],
      references: [users.id],
    }),
    conversation: one(aiConversations, {
      fields: [aiCustomReports.conversationId],
      references: [aiConversations.id],
    }),
  })
);
