import { db } from "@/lib/db";
import { pricebookItems } from "@fieldservice/shared/db/schema";
import {
  eq,
  and,
  or,
  ilike,
  desc,
  asc,
  sql,
} from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { logActivity } from "./activity";
import { escapeLike } from "@/lib/utils";
import { NotFoundError, AppError } from "@/lib/api/errors";
import type { LineItemType } from "@fieldservice/api-types/enums";
import { triggerQBSync } from "@/lib/quickbooks/sync-trigger";

// ---------- Types ----------

export interface ListPricebookParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  type?: LineItemType;
  isActive?: boolean;
  sort?: string;
  order?: "asc" | "desc";
}

export interface CreatePricebookItemInput {
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  type?: LineItemType;
  unitPrice: number;
  unit?: string;
  costPrice?: number;
  taxable?: boolean;
}

export interface UpdatePricebookItemInput {
  name?: string;
  description?: string | null;
  sku?: string | null;
  category?: string | null;
  type?: LineItemType;
  unitPrice?: number;
  unit?: string | null;
  costPrice?: number | null;
  taxable?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

// ---------- List ----------

export async function listPricebookItems(ctx: UserContext, params: ListPricebookParams = {}) {
  assertPermission(ctx, "pricebook", "read");

  const {
    page = 1,
    pageSize: rawPageSize = 50,
    search,
    category,
    type,
    isActive,
    sort = "name",
    order = "asc",
  } = params;
  const pageSize = Math.min(Math.max(rawPageSize, 1), 100);
  const offset = (page - 1) * pageSize;

  const conditions: ReturnType<typeof eq>[] = [eq(pricebookItems.tenantId, ctx.tenantId)];

  if (isActive !== undefined) {
    conditions.push(eq(pricebookItems.isActive, isActive));
  }

  if (category) {
    conditions.push(eq(pricebookItems.category, category));
  }

  if (type) {
    conditions.push(eq(pricebookItems.type, type));
  }

  if (search) {
    const term = `%${escapeLike(search)}%`;
    conditions.push(
      or(
        ilike(pricebookItems.name, term),
        ilike(pricebookItems.description, term),
        ilike(pricebookItems.sku, term)
      )!
    );
  }

  const orderFn = order === "asc" ? asc : desc;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sortMap: Record<string, any> = {
    name: pricebookItems.name,
    category: pricebookItems.category,
    unitPrice: pricebookItems.unitPrice,
    type: pricebookItems.type,
    createdAt: pricebookItems.createdAt,
    sortOrder: pricebookItems.sortOrder,
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const sortColumn = sortMap[sort] ?? pricebookItems.name;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(pricebookItems)
      .where(and(...conditions))
      .orderBy(orderFn(sortColumn))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(pricebookItems)
      .where(and(...conditions)),
  ]);

  return {
    data,
    meta: { page, pageSize, total: Number(countResult[0].count) },
  };
}

// ---------- Get Categories ----------

export async function getPricebookCategories(ctx: UserContext) {
  assertPermission(ctx, "pricebook", "read");

  const result = await db
    .select({ category: pricebookItems.category })
    .from(pricebookItems)
    .where(
      and(
        eq(pricebookItems.tenantId, ctx.tenantId),
        eq(pricebookItems.isActive, true),
        sql`${pricebookItems.category} IS NOT NULL`
      )
    )
    .groupBy(pricebookItems.category)
    .orderBy(asc(pricebookItems.category));

  return result.map((r) => r.category).filter(Boolean) as string[];
}

// ---------- Get ----------

export async function getPricebookItem(ctx: UserContext, itemId: string) {
  assertPermission(ctx, "pricebook", "read");

  const [item] = await db
    .select()
    .from(pricebookItems)
    .where(and(eq(pricebookItems.id, itemId), eq(pricebookItems.tenantId, ctx.tenantId)))
    .limit(1);

  if (!item) throw new NotFoundError("Pricebook item");
  return item;
}

// ---------- Create ----------

export async function createPricebookItem(ctx: UserContext, input: CreatePricebookItemInput) {
  assertPermission(ctx, "pricebook", "create");

  // Check for duplicate SKU
  if (input.sku) {
    const [existing] = await db
      .select({ id: pricebookItems.id })
      .from(pricebookItems)
      .where(
        and(
          eq(pricebookItems.tenantId, ctx.tenantId),
          eq(pricebookItems.sku, input.sku)
        )
      )
      .limit(1);
    if (existing) {
      throw new AppError("VALIDATION_ERROR", `A pricebook item with SKU "${input.sku}" already exists`, 400);
    }
  }

  const [item] = await db
    .insert(pricebookItems)
    .values({
      tenantId: ctx.tenantId,
      name: input.name,
      description: input.description || null,
      sku: input.sku || null,
      category: input.category || null,
      type: input.type || "service",
      unitPrice: String(input.unitPrice),
      unit: input.unit || null,
      costPrice: input.costPrice !== undefined ? String(input.costPrice) : null,
      taxable: input.taxable ?? true,
    })
    .returning();

  await logActivity(ctx, "pricebook", item.id, "created");
  triggerQBSync(ctx.tenantId, "pricebook", item.id, "create");
  return item;
}

// ---------- Update ----------

export async function updatePricebookItem(ctx: UserContext, itemId: string, input: UpdatePricebookItemInput) {
  assertPermission(ctx, "pricebook", "update");

  await getPricebookItem(ctx, itemId);

  // Check for duplicate SKU if changing
  if (input.sku) {
    const [existing] = await db
      .select({ id: pricebookItems.id })
      .from(pricebookItems)
      .where(
        and(
          eq(pricebookItems.tenantId, ctx.tenantId),
          eq(pricebookItems.sku, input.sku),
          sql`${pricebookItems.id} != ${itemId}`
        )
      )
      .limit(1);
    if (existing) {
      throw new AppError("VALIDATION_ERROR", `A pricebook item with SKU "${input.sku}" already exists`, 400);
    }
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.sku !== undefined) updateData.sku = input.sku;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.unitPrice !== undefined) updateData.unitPrice = String(input.unitPrice);
  if (input.unit !== undefined) updateData.unit = input.unit;
  if (input.costPrice !== undefined) updateData.costPrice = input.costPrice !== null ? String(input.costPrice) : null;
  if (input.taxable !== undefined) updateData.taxable = input.taxable;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;
  if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;

  const [updated] = await db
    .update(pricebookItems)
    .set(updateData)
    .where(and(eq(pricebookItems.id, itemId), eq(pricebookItems.tenantId, ctx.tenantId)))
    .returning();

  await logActivity(ctx, "pricebook", itemId, "updated");
  triggerQBSync(ctx.tenantId, "pricebook", itemId, "update");
  return updated;
}

// ---------- Delete (soft via isActive) ----------

export async function deletePricebookItem(ctx: UserContext, itemId: string) {
  assertPermission(ctx, "pricebook", "delete");

  await getPricebookItem(ctx, itemId);

  const [updated] = await db
    .update(pricebookItems)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(pricebookItems.id, itemId), eq(pricebookItems.tenantId, ctx.tenantId)))
    .returning();

  await logActivity(ctx, "pricebook", itemId, "deactivated");
  return updated;
}
