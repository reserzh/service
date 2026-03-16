import { db } from "@/lib/db";
import {
  estimateTemplates,
  estimateTemplateOptions,
  estimateTemplateItems,
} from "@fieldservice/shared/db/schema";
import { eq, and, asc, ilike, sql } from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { NotFoundError } from "@/lib/api/errors";
import { escapeLike } from "@/lib/utils";
import type { LineItemType } from "@fieldservice/api-types/enums";

// ---------- Types ----------

export interface ListEstimateTemplatesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateEstimateTemplateInput {
  name: string;
  description?: string;
  summary?: string;
  notes?: string;
  jobType?: string;
  autoApplyForJobType?: boolean;
  options: {
    name: string;
    description?: string;
    isRecommended?: boolean;
    items: {
      pricebookItemId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
      type?: LineItemType;
      quantityFormula?: string;
      baseQuantity?: number;
    }[];
  }[];
}

export interface UpdateEstimateTemplateInput {
  name?: string;
  description?: string | null;
  summary?: string | null;
  notes?: string | null;
  jobType?: string | null;
  autoApplyForJobType?: boolean;
  isActive?: boolean;
  options?: CreateEstimateTemplateInput["options"];
}

// ---------- List ----------

export async function listEstimateTemplates(
  ctx: UserContext,
  params: ListEstimateTemplatesParams = {}
) {
  assertPermission(ctx, "settings", "read");

  const { page = 1, pageSize: rawPageSize = 50, search, isActive } = params;
  const pageSize = Math.min(Math.max(rawPageSize, 1), 100);
  const offset = (page - 1) * pageSize;

  const conditions: ReturnType<typeof eq>[] = [eq(estimateTemplates.tenantId, ctx.tenantId)];

  if (isActive !== undefined) {
    conditions.push(eq(estimateTemplates.isActive, isActive));
  }

  if (search) {
    const term = `%${escapeLike(search)}%`;
    conditions.push(ilike(estimateTemplates.name, term));
  }

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(estimateTemplates)
      .where(and(...conditions))
      .orderBy(asc(estimateTemplates.name))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(estimateTemplates)
      .where(and(...conditions)),
  ]);

  return {
    data,
    meta: { page, pageSize, total: Number(countResult[0].count) },
  };
}

// ---------- Get ----------

export async function getEstimateTemplate(ctx: UserContext, templateId: string) {
  assertPermission(ctx, "settings", "read");

  const [template] = await db
    .select()
    .from(estimateTemplates)
    .where(and(eq(estimateTemplates.id, templateId), eq(estimateTemplates.tenantId, ctx.tenantId)))
    .limit(1);

  if (!template) throw new NotFoundError("Estimate template");

  const options = await db
    .select()
    .from(estimateTemplateOptions)
    .where(and(eq(estimateTemplateOptions.templateId, templateId), eq(estimateTemplateOptions.tenantId, ctx.tenantId)))
    .orderBy(asc(estimateTemplateOptions.sortOrder));

  const optionsWithItems = await Promise.all(
    options.map(async (option) => {
      const items = await db
        .select()
        .from(estimateTemplateItems)
        .where(and(eq(estimateTemplateItems.optionId, option.id), eq(estimateTemplateItems.tenantId, ctx.tenantId)))
        .orderBy(asc(estimateTemplateItems.sortOrder));
      return { ...option, items };
    })
  );

  return { ...template, options: optionsWithItems };
}

// ---------- Create ----------

export async function createEstimateTemplate(ctx: UserContext, input: CreateEstimateTemplateInput) {
  assertPermission(ctx, "settings", "update");

  return db.transaction(async (tx) => {
    const [template] = await tx
      .insert(estimateTemplates)
      .values({
        tenantId: ctx.tenantId,
        name: input.name,
        description: input.description || null,
        summary: input.summary || null,
        notes: input.notes || null,
        jobType: input.jobType || null,
        autoApplyForJobType: input.autoApplyForJobType ?? false,
      })
      .returning();

    for (let oi = 0; oi < input.options.length; oi++) {
      const opt = input.options[oi];
      const [option] = await tx
        .insert(estimateTemplateOptions)
        .values({
          tenantId: ctx.tenantId,
          templateId: template.id,
          name: opt.name,
          description: opt.description || null,
          isRecommended: opt.isRecommended ?? false,
          sortOrder: oi,
        })
        .returning();

      if (opt.items.length > 0) {
        await tx.insert(estimateTemplateItems).values(
          opt.items.map((item, ii) => ({
            tenantId: ctx.tenantId,
            optionId: option.id,
            pricebookItemId: item.pricebookItemId || null,
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            type: (item.type || "service") as LineItemType,
            quantityFormula: item.quantityFormula || null,
            baseQuantity: item.baseQuantity != null ? String(item.baseQuantity) : null,
            sortOrder: ii,
          }))
        );
      }
    }

    return template;
  });
}

// ---------- Update ----------

export async function updateEstimateTemplate(
  ctx: UserContext,
  templateId: string,
  input: UpdateEstimateTemplateInput
) {
  assertPermission(ctx, "settings", "update");

  await getEstimateTemplate(ctx, templateId);

  return db.transaction(async (tx) => {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.summary !== undefined) updateData.summary = input.summary;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.jobType !== undefined) updateData.jobType = input.jobType;
    if (input.autoApplyForJobType !== undefined) updateData.autoApplyForJobType = input.autoApplyForJobType;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const [updated] = await tx
      .update(estimateTemplates)
      .set(updateData)
      .where(and(eq(estimateTemplates.id, templateId), eq(estimateTemplates.tenantId, ctx.tenantId)))
      .returning();

    // Replace options + items if provided
    if (input.options !== undefined) {
      // Delete existing options (cascades to items)
      await tx
        .delete(estimateTemplateOptions)
        .where(and(eq(estimateTemplateOptions.templateId, templateId), eq(estimateTemplateOptions.tenantId, ctx.tenantId)));

      for (let oi = 0; oi < input.options.length; oi++) {
        const opt = input.options[oi];
        const [option] = await tx
          .insert(estimateTemplateOptions)
          .values({
            tenantId: ctx.tenantId,
            templateId,
            name: opt.name,
            description: opt.description || null,
            isRecommended: opt.isRecommended ?? false,
            sortOrder: oi,
          })
          .returning();

        if (opt.items.length > 0) {
          await tx.insert(estimateTemplateItems).values(
            opt.items.map((item, ii) => ({
              tenantId: ctx.tenantId,
              optionId: option.id,
              pricebookItemId: item.pricebookItemId || null,
              description: item.description,
              quantity: String(item.quantity),
              unitPrice: String(item.unitPrice),
              type: (item.type || "service") as LineItemType,
              quantityFormula: item.quantityFormula || null,
              baseQuantity: item.baseQuantity != null ? String(item.baseQuantity) : null,
              sortOrder: ii,
            }))
          );
        }
      }
    }

    return updated;
  });
}

// ---------- Delete ----------

export async function deleteEstimateTemplate(ctx: UserContext, templateId: string) {
  assertPermission(ctx, "settings", "update");

  await getEstimateTemplate(ctx, templateId);

  await db
    .delete(estimateTemplates)
    .where(and(eq(estimateTemplates.id, templateId), eq(estimateTemplates.tenantId, ctx.tenantId)));
}

// ---------- Create Estimate from Template ----------

export async function createEstimateFromTemplate(
  ctx: UserContext,
  templateId: string,
  input: { customerId: string; propertyId: string; jobId?: string }
) {
  const template = await getEstimateTemplate(ctx, templateId);

  const { createEstimate } = await import("./estimates");

  return createEstimate(ctx, {
    customerId: input.customerId,
    propertyId: input.propertyId,
    jobId: input.jobId,
    summary: template.summary || template.name,
    notes: template.notes || undefined,
    options: template.options.map((opt) => ({
      name: opt.name,
      description: opt.description || undefined,
      isRecommended: opt.isRecommended,
      items: opt.items.map((item) => ({
        pricebookItemId: item.pricebookItemId ?? undefined,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        type: item.type as LineItemType,
      })),
    })),
  });
}
