import { db } from "@/lib/db";
import {
  estimates,
  estimateOptions,
  estimateOptionItems,
  customers,
  properties,
  users,
  jobs,
} from "@fieldservice/shared/db/schema";
import {
  eq,
  and,
  or,
  ilike,
  desc,
  asc,
  sql,
  inArray,
} from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { logActivity } from "./activity";
import { NotFoundError, AppError } from "@/lib/api/errors";
import { getNextSequenceNumber } from "./sequences";

// ---------- Types ----------

type EstimateStatus = "draft" | "sent" | "viewed" | "approved" | "declined" | "expired";
type LineItemType = "service" | "material" | "labor" | "discount" | "other";

export interface ListEstimatesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: EstimateStatus | EstimateStatus[];
  customerId?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export interface CreateEstimateOptionItem {
  description: string;
  quantity: number;
  unitPrice: number;
  type?: LineItemType;
}

export interface CreateEstimateOption {
  name: string;
  description?: string;
  isRecommended?: boolean;
  items: CreateEstimateOptionItem[];
}

export interface CreateEstimateInput {
  customerId: string;
  propertyId: string;
  jobId?: string;
  summary: string;
  notes?: string;
  internalNotes?: string;
  validUntil?: string;
  options: CreateEstimateOption[];
}

export interface UpdateEstimateInput {
  summary?: string;
  notes?: string | null;
  internalNotes?: string | null;
  validUntil?: string | null;
}

// ---------- List ----------

export async function listEstimates(ctx: UserContext, params: ListEstimatesParams = {}) {
  assertPermission(ctx, "estimates", "read");

  const {
    page = 1,
    pageSize: rawPageSize = 25,
    search,
    status,
    customerId,
    sort = "createdAt",
    order = "desc",
  } = params;
  const pageSize = Math.min(Math.max(rawPageSize, 1), 100);
  const offset = (page - 1) * pageSize;

  const conditions: ReturnType<typeof eq>[] = [eq(estimates.tenantId, ctx.tenantId)];

  if (status) {
    if (Array.isArray(status)) {
      conditions.push(inArray(estimates.status, status));
    } else {
      conditions.push(eq(estimates.status, status));
    }
  }

  if (customerId) {
    conditions.push(eq(estimates.customerId, customerId));
  }

  if (search) {
    const term = `%${search}%`;
    conditions.push(
      or(
        ilike(estimates.summary, term),
        ilike(estimates.estimateNumber, term)
      )!
    );
  }

  const orderFn = order === "asc" ? asc : desc;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sortMap: Record<string, any> = {
    createdAt: estimates.createdAt,
    estimateNumber: estimates.estimateNumber,
    status: estimates.status,
    totalAmount: estimates.totalAmount,
    validUntil: estimates.validUntil,
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const sortColumn = sortMap[sort] ?? estimates.createdAt;

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: estimates.id,
        estimateNumber: estimates.estimateNumber,
        summary: estimates.summary,
        status: estimates.status,
        totalAmount: estimates.totalAmount,
        validUntil: estimates.validUntil,
        sentAt: estimates.sentAt,
        approvedAt: estimates.approvedAt,
        createdAt: estimates.createdAt,
        customerId: estimates.customerId,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
        jobId: estimates.jobId,
      })
      .from(estimates)
      .leftJoin(customers, eq(estimates.customerId, customers.id))
      .where(and(...conditions))
      .orderBy(orderFn(sortColumn))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(estimates)
      .where(and(...conditions)),
  ]);

  return {
    data,
    meta: { page, pageSize, total: Number(countResult[0].count) },
  };
}

// ---------- Get ----------

export async function getEstimate(ctx: UserContext, estimateId: string) {
  assertPermission(ctx, "estimates", "read");

  const [estimate] = await db
    .select()
    .from(estimates)
    .where(and(eq(estimates.id, estimateId), eq(estimates.tenantId, ctx.tenantId)))
    .limit(1);

  if (!estimate) throw new NotFoundError("Estimate");
  return estimate;
}

export async function getEstimateWithRelations(ctx: UserContext, estimateId: string) {
  const estimate = await getEstimate(ctx, estimateId);

  const [customer, property, createdByUser, options] = await Promise.all([
    db.select().from(customers).where(eq(customers.id, estimate.customerId)).limit(1).then((r) => r[0]),
    db.select().from(properties).where(eq(properties.id, estimate.propertyId)).limit(1).then((r) => r[0]),
    db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
      .from(users).where(eq(users.id, estimate.createdBy)).limit(1).then((r) => r[0]),
    db.select().from(estimateOptions)
      .where(and(eq(estimateOptions.estimateId, estimateId), eq(estimateOptions.tenantId, ctx.tenantId)))
      .orderBy(asc(estimateOptions.sortOrder)),
  ]);

  // Fetch items for each option
  const optionIds = options.map((o) => o.id);
  const allItems = optionIds.length > 0
    ? await db.select().from(estimateOptionItems)
        .where(and(
          inArray(estimateOptionItems.optionId, optionIds),
          eq(estimateOptionItems.tenantId, ctx.tenantId)
        ))
        .orderBy(asc(estimateOptionItems.sortOrder))
    : [];

  const optionsWithItems = options.map((option) => ({
    ...option,
    items: allItems.filter((item) => item.optionId === option.id),
  }));

  // Fetch linked job if exists
  const linkedJob = estimate.jobId
    ? await db.select({ id: jobs.id, jobNumber: jobs.jobNumber, summary: jobs.summary, status: jobs.status })
        .from(jobs).where(eq(jobs.id, estimate.jobId)).limit(1).then((r) => r[0])
    : null;

  return {
    ...estimate,
    customer,
    property,
    createdByUser,
    options: optionsWithItems,
    linkedJob,
  };
}

// ---------- Create ----------

export async function createEstimate(ctx: UserContext, input: CreateEstimateInput) {
  assertPermission(ctx, "estimates", "create");

  if (!input.options || input.options.length === 0) {
    throw new AppError("VALIDATION_ERROR", "At least one option is required", 400);
  }

  const estimateNumber = await getNextSequenceNumber(ctx.tenantId, "estimate");

  const result = await db.transaction(async (tx) => {
    // Validate customer belongs to tenant
    const [customer] = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, input.customerId), eq(customers.tenantId, ctx.tenantId)))
      .limit(1);
    if (!customer) throw new NotFoundError("Customer");

    // Validate property belongs to tenant
    const [property] = await tx
      .select({ id: properties.id })
      .from(properties)
      .where(and(eq(properties.id, input.propertyId), eq(properties.tenantId, ctx.tenantId)))
      .limit(1);
    if (!property) throw new NotFoundError("Property");

    // Validate job if linked
    if (input.jobId) {
      const [job] = await tx
        .select({ id: jobs.id })
        .from(jobs)
        .where(and(eq(jobs.id, input.jobId), eq(jobs.tenantId, ctx.tenantId)))
        .limit(1);
      if (!job) throw new NotFoundError("Job");
    }

    // Create estimate
    const [estimate] = await tx
      .insert(estimates)
      .values({
        tenantId: ctx.tenantId,
        estimateNumber,
        customerId: input.customerId,
        propertyId: input.propertyId,
        jobId: input.jobId || null,
        createdBy: ctx.userId,
        summary: input.summary,
        notes: input.notes || null,
        internalNotes: input.internalNotes || null,
        validUntil: input.validUntil || null,
      })
      .returning();

    // Create options and items
    let maxTotal = 0;

    for (let i = 0; i < input.options.length; i++) {
      const opt = input.options[i];

      // Calculate option total
      const optionTotal = opt.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      if (optionTotal > maxTotal) maxTotal = optionTotal;

      const [option] = await tx
        .insert(estimateOptions)
        .values({
          tenantId: ctx.tenantId,
          estimateId: estimate.id,
          name: opt.name,
          description: opt.description || null,
          isRecommended: opt.isRecommended ?? false,
          total: String(optionTotal),
          sortOrder: i,
        })
        .returning();

      // Insert items for this option
      if (opt.items.length > 0) {
        const items = opt.items.map((item, idx) => ({
          tenantId: ctx.tenantId,
          optionId: option.id,
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          total: String(item.quantity * item.unitPrice),
          type: (item.type || "service") as LineItemType,
          sortOrder: idx,
        }));
        await tx.insert(estimateOptionItems).values(items);
      }
    }

    // Set estimate total to the highest option total (for display purposes)
    await tx
      .update(estimates)
      .set({ totalAmount: String(maxTotal) })
      .where(eq(estimates.id, estimate.id));

    return estimate;
  });

  await logActivity(ctx, "estimate", result.id, "created");
  return result;
}

// ---------- Update ----------

export async function updateEstimate(ctx: UserContext, estimateId: string, input: UpdateEstimateInput) {
  assertPermission(ctx, "estimates", "update");

  const estimate = await getEstimate(ctx, estimateId);

  if (estimate.status !== "draft") {
    throw new AppError("INVALID_STATE", "Only draft estimates can be edited", 422);
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.summary !== undefined) updateData.summary = input.summary;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.internalNotes !== undefined) updateData.internalNotes = input.internalNotes;
  if (input.validUntil !== undefined) updateData.validUntil = input.validUntil;

  const [updated] = await db
    .update(estimates)
    .set(updateData)
    .where(and(eq(estimates.id, estimateId), eq(estimates.tenantId, ctx.tenantId)))
    .returning();

  await logActivity(ctx, "estimate", estimateId, "updated");
  return updated;
}

// ---------- Status transitions ----------

export async function sendEstimate(ctx: UserContext, estimateId: string) {
  assertPermission(ctx, "estimates", "update");
  const estimate = await getEstimate(ctx, estimateId);

  if (estimate.status !== "draft") {
    throw new AppError("INVALID_STATE", "Only draft estimates can be sent", 422);
  }

  const [updated] = await db
    .update(estimates)
    .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
    .where(eq(estimates.id, estimateId))
    .returning();

  await logActivity(ctx, "estimate", estimateId, "sent");
  return updated;
}

export async function approveEstimate(ctx: UserContext, estimateId: string, optionId: string) {
  assertPermission(ctx, "estimates", "update");
  const estimate = await getEstimate(ctx, estimateId);

  if (!["sent", "viewed"].includes(estimate.status)) {
    throw new AppError("INVALID_STATE", "Estimate must be sent or viewed to be approved", 422);
  }

  // Validate option belongs to this estimate
  const [option] = await db
    .select()
    .from(estimateOptions)
    .where(
      and(
        eq(estimateOptions.id, optionId),
        eq(estimateOptions.estimateId, estimateId),
        eq(estimateOptions.tenantId, ctx.tenantId)
      )
    )
    .limit(1);

  if (!option) throw new NotFoundError("Estimate option");

  const [updated] = await db
    .update(estimates)
    .set({
      status: "approved",
      approvedAt: new Date(),
      approvedOptionId: optionId,
      totalAmount: option.total,
      updatedAt: new Date(),
    })
    .where(eq(estimates.id, estimateId))
    .returning();

  await logActivity(ctx, "estimate", estimateId, "approved", { optionId, optionName: option.name });
  return updated;
}

export async function declineEstimate(ctx: UserContext, estimateId: string) {
  assertPermission(ctx, "estimates", "update");
  const estimate = await getEstimate(ctx, estimateId);

  if (!["sent", "viewed"].includes(estimate.status)) {
    throw new AppError("INVALID_STATE", "Estimate must be sent or viewed to be declined", 422);
  }

  const [updated] = await db
    .update(estimates)
    .set({ status: "declined", updatedAt: new Date() })
    .where(eq(estimates.id, estimateId))
    .returning();

  await logActivity(ctx, "estimate", estimateId, "declined");
  return updated;
}

// ---------- Option management ----------

export async function addEstimateOption(
  ctx: UserContext,
  estimateId: string,
  input: CreateEstimateOption
) {
  assertPermission(ctx, "estimates", "update");
  const estimate = await getEstimate(ctx, estimateId);

  if (estimate.status !== "draft") {
    throw new AppError("INVALID_STATE", "Only draft estimates can be edited", 422);
  }

  const optionTotal = input.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  // Get max sort order
  const maxSort = await db
    .select({ max: sql<number>`coalesce(max(${estimateOptions.sortOrder}), -1)` })
    .from(estimateOptions)
    .where(and(eq(estimateOptions.estimateId, estimateId), eq(estimateOptions.tenantId, ctx.tenantId)));

  const [option] = await db
    .insert(estimateOptions)
    .values({
      tenantId: ctx.tenantId,
      estimateId,
      name: input.name,
      description: input.description || null,
      isRecommended: input.isRecommended ?? false,
      total: String(optionTotal),
      sortOrder: Number(maxSort[0].max) + 1,
    })
    .returning();

  if (input.items.length > 0) {
    const items = input.items.map((item, idx) => ({
      tenantId: ctx.tenantId,
      optionId: option.id,
      description: item.description,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
      total: String(item.quantity * item.unitPrice),
      type: (item.type || "service") as LineItemType,
      sortOrder: idx,
    }));
    await db.insert(estimateOptionItems).values(items);
  }

  await recalculateEstimateTotal(ctx.tenantId, estimateId);
  return option;
}

export async function deleteEstimateOption(ctx: UserContext, estimateId: string, optionId: string) {
  assertPermission(ctx, "estimates", "update");
  const estimate = await getEstimate(ctx, estimateId);

  if (estimate.status !== "draft") {
    throw new AppError("INVALID_STATE", "Only draft estimates can be edited", 422);
  }

  await db
    .delete(estimateOptions)
    .where(
      and(
        eq(estimateOptions.id, optionId),
        eq(estimateOptions.estimateId, estimateId),
        eq(estimateOptions.tenantId, ctx.tenantId)
      )
    );

  await recalculateEstimateTotal(ctx.tenantId, estimateId);
}

async function recalculateEstimateTotal(tenantId: string, estimateId: string) {
  const result = await db
    .select({ max: sql<string>`coalesce(max(${estimateOptions.total}::numeric), 0)` })
    .from(estimateOptions)
    .where(and(eq(estimateOptions.estimateId, estimateId), eq(estimateOptions.tenantId, tenantId)));

  await db
    .update(estimates)
    .set({ totalAmount: result[0].max, updatedAt: new Date() })
    .where(eq(estimates.id, estimateId));
}

// ---------- Convert estimate to invoice ----------

export async function convertEstimateToInvoice(ctx: UserContext, estimateId: string) {
  assertPermission(ctx, "estimates", "read");
  assertPermission(ctx, "invoices", "create");

  const estimate = await getEstimateWithRelations(ctx, estimateId);

  if (estimate.status !== "approved") {
    throw new AppError("INVALID_STATE", "Only approved estimates can be converted to invoices", 422);
  }

  // Find the approved option
  const approvedOption = estimate.options.find((o) => o.id === estimate.approvedOptionId);
  if (!approvedOption) throw new AppError("INVALID_STATE", "Approved option not found", 422);

  // Return the data needed to create an invoice (the actual creation uses the invoice service)
  return {
    customerId: estimate.customerId,
    jobId: estimate.jobId,
    estimateId: estimate.id,
    lineItems: approvedOption.items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      type: item.type as LineItemType,
    })),
  };
}
