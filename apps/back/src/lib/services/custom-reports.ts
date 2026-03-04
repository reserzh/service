import { eq, and, desc, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiCustomReports } from "@fieldservice/shared/db/schema";
import type { UserContext } from "@/lib/auth";

const MAX_CACHED_DATA_SIZE = 50_000; // 50KB

export async function listCustomReports(
  ctx: UserContext,
  opts: { page?: number; pageSize?: number } = {}
) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 20;

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: aiCustomReports.id,
        title: aiCustomReports.title,
        description: aiCustomReports.description,
        lastRefreshedAt: aiCustomReports.lastRefreshedAt,
        createdAt: aiCustomReports.createdAt,
      })
      .from(aiCustomReports)
      .where(
        and(
          eq(aiCustomReports.tenantId, ctx.tenantId),
          eq(aiCustomReports.userId, ctx.userId),
          eq(aiCustomReports.isActive, true)
        )
      )
      .orderBy(desc(aiCustomReports.updatedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: count() })
      .from(aiCustomReports)
      .where(
        and(
          eq(aiCustomReports.tenantId, ctx.tenantId),
          eq(aiCustomReports.userId, ctx.userId),
          eq(aiCustomReports.isActive, true)
        )
      ),
  ]);

  return {
    data: rows,
    meta: { page, pageSize, total: total?.count ?? 0 },
  };
}

export async function getCustomReport(ctx: UserContext, id: string) {
  const rows = await db
    .select()
    .from(aiCustomReports)
    .where(
      and(
        eq(aiCustomReports.id, id),
        eq(aiCustomReports.tenantId, ctx.tenantId),
        eq(aiCustomReports.userId, ctx.userId),
        eq(aiCustomReports.isActive, true)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function createCustomReport(
  ctx: UserContext,
  data: {
    title: string;
    description?: string;
    reportConfig: {
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
    };
    queryDefinition: {
      tools: Array<{ name: string; params: Record<string, unknown> }>;
      prompt: string;
    };
    cachedData?: Record<string, unknown>;
    conversationId?: string;
  }
) {
  if (data.cachedData) {
    const size = JSON.stringify(data.cachedData).length;
    if (size > MAX_CACHED_DATA_SIZE) {
      throw new Error("Report data too large.");
    }
  }

  const [row] = await db
    .insert(aiCustomReports)
    .values({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      title: data.title,
      description: data.description ?? null,
      reportConfig: data.reportConfig,
      queryDefinition: data.queryDefinition,
      cachedData: data.cachedData ?? null,
      conversationId: data.conversationId ?? null,
      lastRefreshedAt: new Date(),
    })
    .returning();

  return row;
}

export async function updateCustomReport(
  ctx: UserContext,
  id: string,
  updates: {
    title?: string;
    description?: string;
    reportConfig?: {
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
    };
    cachedData?: Record<string, unknown>;
  }
) {
  if (updates.cachedData) {
    const size = JSON.stringify(updates.cachedData).length;
    if (size > MAX_CACHED_DATA_SIZE) {
      throw new Error("Report data too large.");
    }
  }

  const [row] = await db
    .update(aiCustomReports)
    .set({
      ...updates,
      updatedAt: new Date(),
      ...(updates.cachedData && { lastRefreshedAt: new Date() }),
    })
    .where(
      and(
        eq(aiCustomReports.id, id),
        eq(aiCustomReports.tenantId, ctx.tenantId),
        eq(aiCustomReports.userId, ctx.userId)
      )
    )
    .returning();

  return row ?? null;
}

export async function deleteCustomReport(ctx: UserContext, id: string) {
  const [row] = await db
    .update(aiCustomReports)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(
        eq(aiCustomReports.id, id),
        eq(aiCustomReports.tenantId, ctx.tenantId),
        eq(aiCustomReports.userId, ctx.userId)
      )
    )
    .returning();

  return row ?? null;
}
