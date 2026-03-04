import { fieldserviceSchema } from "./pg-schema";
import { uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants";
import { users } from "./users";

// ==================== AI Conversations ====================

export const aiConversations = fieldserviceSchema.table(
  "ai_conversations",
  {
    id: uuid().defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("ai_conversations_tenant_user_idx").on(table.tenantId, table.userId),
    index("ai_conversations_tenant_updated_idx").on(
      table.tenantId,
      table.updatedAt
    ),
  ]
);

export const aiConversationsRelations = relations(
  aiConversations,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [aiConversations.tenantId],
      references: [tenants.id],
    }),
    user: one(users, {
      fields: [aiConversations.userId],
      references: [users.id],
    }),
    messages: many(aiMessages),
  })
);

// ==================== AI Messages ====================

export const aiMessages = fieldserviceSchema.table(
  "ai_messages",
  {
    id: uuid().defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => aiConversations.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    role: text().notNull().$type<"user" | "assistant">(),
    content: text().notNull(),
    metadata: jsonb().$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("ai_messages_conversation_idx").on(table.conversationId),
    index("ai_messages_tenant_idx").on(table.tenantId),
  ]
);

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  conversation: one(aiConversations, {
    fields: [aiMessages.conversationId],
    references: [aiConversations.id],
  }),
}));
