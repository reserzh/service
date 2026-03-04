import { db } from "@/lib/db";
import {
  aiConversations,
  aiMessages,
} from "@fieldservice/shared/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { NotFoundError } from "@/lib/api/errors";

// ==================== Conversations ====================

export async function listConversations(
  ctx: UserContext,
  params: { page?: number; pageSize?: number } = {}
) {
  assertPermission(ctx, "ai_assistant", "read");

  const { page = 1, pageSize: rawPageSize = 25 } = params;
  const pageSize = Math.min(Math.max(rawPageSize, 1), 100);
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: aiConversations.id,
        title: aiConversations.title,
        createdAt: aiConversations.createdAt,
        updatedAt: aiConversations.updatedAt,
      })
      .from(aiConversations)
      .where(
        and(
          eq(aiConversations.tenantId, ctx.tenantId),
          eq(aiConversations.userId, ctx.userId)
        )
      )
      .orderBy(desc(aiConversations.updatedAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(aiConversations)
      .where(
        and(
          eq(aiConversations.tenantId, ctx.tenantId),
          eq(aiConversations.userId, ctx.userId)
        )
      ),
  ]);

  return {
    data,
    meta: { page, pageSize, total: Number(countResult[0].count) },
  };
}

export async function getConversation(ctx: UserContext, id: string) {
  assertPermission(ctx, "ai_assistant", "read");

  const [conversation] = await db
    .select()
    .from(aiConversations)
    .where(
      and(
        eq(aiConversations.id, id),
        eq(aiConversations.tenantId, ctx.tenantId),
        eq(aiConversations.userId, ctx.userId)
      )
    )
    .limit(1);

  if (!conversation) throw new NotFoundError("Conversation");

  const messages = await db
    .select({
      id: aiMessages.id,
      role: aiMessages.role,
      content: aiMessages.content,
      metadata: aiMessages.metadata,
      createdAt: aiMessages.createdAt,
    })
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, id))
    .orderBy(aiMessages.createdAt);

  return { ...conversation, messages };
}

export async function createConversation(ctx: UserContext, title: string) {
  assertPermission(ctx, "ai_assistant", "read");

  const [conversation] = await db
    .insert(aiConversations)
    .values({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      title: title.slice(0, 100),
    })
    .returning();

  return conversation;
}

export async function updateConversationTitle(
  ctx: UserContext,
  id: string,
  title: string
) {
  assertPermission(ctx, "ai_assistant", "read");

  const [updated] = await db
    .update(aiConversations)
    .set({ title: title.slice(0, 100), updatedAt: new Date() })
    .where(
      and(
        eq(aiConversations.id, id),
        eq(aiConversations.tenantId, ctx.tenantId),
        eq(aiConversations.userId, ctx.userId)
      )
    )
    .returning();

  if (!updated) throw new NotFoundError("Conversation");
  return updated;
}

export async function deleteConversation(ctx: UserContext, id: string) {
  assertPermission(ctx, "ai_assistant", "read");

  const [deleted] = await db
    .delete(aiConversations)
    .where(
      and(
        eq(aiConversations.id, id),
        eq(aiConversations.tenantId, ctx.tenantId),
        eq(aiConversations.userId, ctx.userId)
      )
    )
    .returning({ id: aiConversations.id });

  if (!deleted) throw new NotFoundError("Conversation");
  return deleted;
}

// ==================== Messages ====================

export async function addMessage(
  ctx: UserContext,
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: Record<string, unknown>
) {
  const [message] = await db
    .insert(aiMessages)
    .values({
      conversationId,
      tenantId: ctx.tenantId,
      role,
      content,
      metadata: metadata ?? null,
    })
    .returning();

  // Bump conversation updatedAt (scoped by tenant + user)
  await db
    .update(aiConversations)
    .set({ updatedAt: new Date() })
    .where(
      and(
        eq(aiConversations.id, conversationId),
        eq(aiConversations.tenantId, ctx.tenantId),
        eq(aiConversations.userId, ctx.userId)
      )
    );

  return message;
}

export async function getConversationMessages(
  ctx: UserContext,
  conversationId: string,
  limit: number = 50
) {
  return db
    .select({
      role: aiMessages.role,
      content: aiMessages.content,
    })
    .from(aiMessages)
    .where(
      and(
        eq(aiMessages.conversationId, conversationId),
        eq(aiMessages.tenantId, ctx.tenantId)
      )
    )
    .orderBy(aiMessages.createdAt)
    .limit(limit);
}
