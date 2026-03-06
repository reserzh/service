import { db } from "@/lib/db";
import {
  checklistTemplates,
  checklistTemplateItems,
  jobChecklistItems,
} from "@fieldservice/shared/db/schema";
import { eq, and, asc, desc, ilike, sql, or, isNull } from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { NotFoundError } from "@/lib/api/errors";
import { escapeLike } from "@/lib/utils";

// ---------- Types ----------

export interface ListChecklistTemplatesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  jobType?: string;
  isActive?: boolean;
}

export interface CreateChecklistTemplateInput {
  name: string;
  description?: string;
  jobType?: string;
  autoApplyOnDispatch?: boolean;
  items: { label: string; groupName?: string }[];
}

export interface UpdateChecklistTemplateInput {
  name?: string;
  description?: string | null;
  jobType?: string | null;
  isActive?: boolean;
  autoApplyOnDispatch?: boolean;
  items?: { label: string; groupName?: string }[];
}

// ---------- List ----------

export async function listChecklistTemplates(
  ctx: UserContext,
  params: ListChecklistTemplatesParams = {}
) {
  assertPermission(ctx, "settings", "read");

  const { page = 1, pageSize: rawPageSize = 50, search, jobType, isActive } = params;
  const pageSize = Math.min(Math.max(rawPageSize, 1), 100);
  const offset = (page - 1) * pageSize;

  const conditions: ReturnType<typeof eq>[] = [eq(checklistTemplates.tenantId, ctx.tenantId)];

  if (isActive !== undefined) {
    conditions.push(eq(checklistTemplates.isActive, isActive));
  }

  if (jobType) {
    conditions.push(eq(checklistTemplates.jobType, jobType));
  }

  if (search) {
    const term = `%${escapeLike(search)}%`;
    conditions.push(ilike(checklistTemplates.name, term));
  }

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(checklistTemplates)
      .where(and(...conditions))
      .orderBy(asc(checklistTemplates.name))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(checklistTemplates)
      .where(and(...conditions)),
  ]);

  return {
    data,
    meta: { page, pageSize, total: Number(countResult[0].count) },
  };
}

// ---------- Get ----------

export async function getChecklistTemplate(ctx: UserContext, templateId: string) {
  assertPermission(ctx, "settings", "read");

  const [template] = await db
    .select()
    .from(checklistTemplates)
    .where(and(eq(checklistTemplates.id, templateId), eq(checklistTemplates.tenantId, ctx.tenantId)))
    .limit(1);

  if (!template) throw new NotFoundError("Checklist template");

  const items = await db
    .select()
    .from(checklistTemplateItems)
    .where(and(eq(checklistTemplateItems.templateId, templateId), eq(checklistTemplateItems.tenantId, ctx.tenantId)))
    .orderBy(asc(checklistTemplateItems.sortOrder));

  return { ...template, items };
}

// ---------- Create ----------

export async function createChecklistTemplate(ctx: UserContext, input: CreateChecklistTemplateInput) {
  assertPermission(ctx, "settings", "update");

  return db.transaction(async (tx) => {
    const [template] = await tx
      .insert(checklistTemplates)
      .values({
        tenantId: ctx.tenantId,
        name: input.name,
        description: input.description || null,
        jobType: input.jobType || null,
        autoApplyOnDispatch: input.autoApplyOnDispatch ?? false,
      })
      .returning();

    if (input.items.length > 0) {
      const groupOrderMap = computeGroupSortOrder(input.items);
      await tx.insert(checklistTemplateItems).values(
        input.items.map((item, idx) => ({
          tenantId: ctx.tenantId,
          templateId: template.id,
          label: item.label,
          groupName: item.groupName || null,
          groupSortOrder: groupOrderMap.get(item.groupName || null) ?? 0,
          sortOrder: idx,
        }))
      );
    }

    return template;
  });
}

// ---------- Update ----------

export async function updateChecklistTemplate(
  ctx: UserContext,
  templateId: string,
  input: UpdateChecklistTemplateInput
) {
  assertPermission(ctx, "settings", "update");

  await getChecklistTemplate(ctx, templateId);

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.jobType !== undefined) updateData.jobType = input.jobType;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;
  if (input.autoApplyOnDispatch !== undefined) updateData.autoApplyOnDispatch = input.autoApplyOnDispatch;

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(checklistTemplates)
      .set(updateData)
      .where(and(eq(checklistTemplates.id, templateId), eq(checklistTemplates.tenantId, ctx.tenantId)))
      .returning();

    // Replace items if provided
    if (input.items !== undefined) {
      await tx
        .delete(checklistTemplateItems)
        .where(and(eq(checklistTemplateItems.templateId, templateId), eq(checklistTemplateItems.tenantId, ctx.tenantId)));

      if (input.items.length > 0) {
        const groupOrderMap = computeGroupSortOrder(input.items);
        await tx.insert(checklistTemplateItems).values(
          input.items.map((item, idx) => ({
            tenantId: ctx.tenantId,
            templateId,
            label: item.label,
            groupName: item.groupName || null,
            groupSortOrder: groupOrderMap.get(item.groupName || null) ?? 0,
            sortOrder: idx,
          }))
        );
      }
    }

    return updated;
  });
}

// ---------- Delete ----------

export async function deleteChecklistTemplate(ctx: UserContext, templateId: string) {
  assertPermission(ctx, "settings", "update");

  await getChecklistTemplate(ctx, templateId);

  await db
    .delete(checklistTemplates)
    .where(and(eq(checklistTemplates.id, templateId), eq(checklistTemplates.tenantId, ctx.tenantId)));
}

// ---------- Apply to Job ----------

export async function applyChecklistTemplate(ctx: UserContext, jobId: string, templateId: string) {
  assertPermission(ctx, "jobs", "update");

  const template = await getChecklistTemplate(ctx, templateId);

  if (template.items.length === 0) return [];

  // Get max sort order for existing checklist items
  const maxSort = await db
    .select({ max: sql<number>`coalesce(max(${jobChecklistItems.sortOrder}), -1)` })
    .from(jobChecklistItems)
    .where(and(eq(jobChecklistItems.jobId, jobId), eq(jobChecklistItems.tenantId, ctx.tenantId)));

  const startOrder = Number(maxSort[0].max) + 1;

  const items = await db
    .insert(jobChecklistItems)
    .values(
      template.items.map((item, idx) => ({
        tenantId: ctx.tenantId,
        jobId,
        label: item.label,
        groupName: item.groupName,
        groupSortOrder: item.groupSortOrder,
        sortOrder: startOrder + idx,
      }))
    )
    .returning();

  return items;
}

// ---------- Auto-Apply Helpers ----------

export async function getAutoApplyTemplates(ctx: UserContext, jobType: string) {
  return db
    .select()
    .from(checklistTemplates)
    .where(
      and(
        eq(checklistTemplates.tenantId, ctx.tenantId),
        eq(checklistTemplates.isActive, true),
        eq(checklistTemplates.autoApplyOnDispatch, true),
        or(eq(checklistTemplates.jobType, jobType), isNull(checklistTemplates.jobType))
      )
    );
}

// ---------- Helpers ----------

function computeGroupSortOrder(items: { groupName?: string }[]): Map<string | null, number> {
  const map = new Map<string | null, number>();
  let order = 0;
  for (const item of items) {
    const key = item.groupName || null;
    if (!map.has(key)) {
      map.set(key, order++);
    }
  }
  return map;
}
