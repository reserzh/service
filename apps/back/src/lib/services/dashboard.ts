import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  userDashboardLayouts,
  aiDashboardWidgets,
} from "@fieldservice/shared/db/schema";
import type { UserContext } from "@/lib/auth";

const MAX_AI_WIDGETS = 10;
const MAX_CACHED_DATA_SIZE = 50_000; // 50KB

// ==================== Dashboard Layout ====================

export async function getUserDashboardLayout(ctx: UserContext) {
  const rows = await db
    .select()
    .from(userDashboardLayouts)
    .where(
      and(
        eq(userDashboardLayouts.tenantId, ctx.tenantId),
        eq(userDashboardLayouts.userId, ctx.userId)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function saveUserDashboardLayout(
  ctx: UserContext,
  data: {
    widgetOrder: string[];
    widgetSizes: Record<string, "full" | "half">;
  }
) {
  const existing = await getUserDashboardLayout(ctx);

  if (existing) {
    await db
      .update(userDashboardLayouts)
      .set({
        widgetOrder: data.widgetOrder,
        widgetSizes: data.widgetSizes,
        updatedAt: new Date(),
      })
      .where(eq(userDashboardLayouts.id, existing.id));
    return { ...existing, ...data };
  }

  const [row] = await db
    .insert(userDashboardLayouts)
    .values({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      widgetOrder: data.widgetOrder,
      widgetSizes: data.widgetSizes,
    })
    .returning();
  return row;
}

// ==================== AI Dashboard Widgets ====================

export async function getUserAIWidgets(ctx: UserContext) {
  return db
    .select()
    .from(aiDashboardWidgets)
    .where(
      and(
        eq(aiDashboardWidgets.tenantId, ctx.tenantId),
        eq(aiDashboardWidgets.userId, ctx.userId),
        eq(aiDashboardWidgets.isActive, true)
      )
    )
    .orderBy(desc(aiDashboardWidgets.createdAt));
}

export async function createAIWidget(
  ctx: UserContext,
  data: {
    title: string;
    widgetConfig: {
      chartType: "bar" | "line" | "area" | "pie";
      xKey?: string;
      yKey?: string;
      nameKey?: string;
      valueKey?: string;
    };
    queryDefinition: {
      tools: Array<{ name: string; params: Record<string, unknown> }>;
      prompt: string;
    };
    cachedData?: Record<string, unknown>;
    conversationId?: string;
  }
) {
  // Check limit
  const existing = await getUserAIWidgets(ctx);
  if (existing.length >= MAX_AI_WIDGETS) {
    throw new Error(`Maximum of ${MAX_AI_WIDGETS} AI widgets allowed per user.`);
  }

  // Check cached data size
  if (data.cachedData) {
    const size = JSON.stringify(data.cachedData).length;
    if (size > MAX_CACHED_DATA_SIZE) {
      throw new Error("Widget data too large.");
    }
  }

  const [row] = await db
    .insert(aiDashboardWidgets)
    .values({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      title: data.title,
      widgetConfig: data.widgetConfig,
      queryDefinition: data.queryDefinition,
      cachedData: data.cachedData ?? null,
      conversationId: data.conversationId ?? null,
      lastRefreshedAt: new Date(),
    })
    .returning();

  return row;
}

export async function updateAIWidget(
  ctx: UserContext,
  id: string,
  updates: {
    title?: string;
    widgetConfig?: {
      chartType: "bar" | "line" | "area" | "pie";
      xKey?: string;
      yKey?: string;
      nameKey?: string;
      valueKey?: string;
    };
    queryDefinition?: {
      tools: Array<{ name: string; params: Record<string, unknown> }>;
      prompt: string;
    };
    cachedData?: Record<string, unknown>;
  }
) {
  if (updates.cachedData) {
    const size = JSON.stringify(updates.cachedData).length;
    if (size > MAX_CACHED_DATA_SIZE) {
      throw new Error("Widget data too large.");
    }
  }

  const [row] = await db
    .update(aiDashboardWidgets)
    .set({
      ...updates,
      updatedAt: new Date(),
      ...(updates.cachedData && { lastRefreshedAt: new Date() }),
    })
    .where(
      and(
        eq(aiDashboardWidgets.id, id),
        eq(aiDashboardWidgets.tenantId, ctx.tenantId),
        eq(aiDashboardWidgets.userId, ctx.userId)
      )
    )
    .returning();

  return row ?? null;
}

export async function deleteAIWidget(ctx: UserContext, id: string) {
  const [row] = await db
    .update(aiDashboardWidgets)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(
        eq(aiDashboardWidgets.id, id),
        eq(aiDashboardWidgets.tenantId, ctx.tenantId),
        eq(aiDashboardWidgets.userId, ctx.userId)
      )
    )
    .returning();

  return row ?? null;
}
