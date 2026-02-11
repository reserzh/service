import { db } from "@/lib/db";
import {
  invoices,
  invoiceLineItems,
  payments,
  customers,
  users,
  jobs,
  estimates,
} from "@/lib/db/schema";
import {
  eq,
  and,
  or,
  ilike,
  desc,
  asc,
  sql,
  inArray,
  gte,
  lte,
} from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { logActivity } from "./activity";
import { NotFoundError, AppError } from "@/lib/api/errors";
import { getNextSequenceNumber } from "./sequences";

// ---------- Types ----------

type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "partial" | "overdue" | "void";
type LineItemType = "service" | "material" | "labor" | "discount" | "other";
type PaymentMethod = "credit_card" | "debit_card" | "ach" | "cash" | "check" | "other";
type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export interface ListInvoicesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: InvoiceStatus | InvoiceStatus[];
  customerId?: string;
  from?: string;
  to?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export interface CreateInvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  type?: LineItemType;
}

export interface CreateInvoiceInput {
  customerId: string;
  jobId?: string;
  estimateId?: string;
  dueDate: string;
  taxRate?: number;
  notes?: string;
  internalNotes?: string;
  lineItems: CreateInvoiceLineItem[];
}

export interface UpdateInvoiceInput {
  dueDate?: string;
  taxRate?: number;
  notes?: string | null;
  internalNotes?: string | null;
}

export interface RecordPaymentInput {
  amount: number;
  method: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

// ---------- List ----------

export async function listInvoices(ctx: UserContext, params: ListInvoicesParams = {}) {
  assertPermission(ctx, "invoices", "read");

  const {
    page = 1,
    pageSize: rawPageSize = 25,
    search,
    status,
    customerId,
    from,
    to,
    sort = "createdAt",
    order = "desc",
  } = params;
  const pageSize = Math.min(Math.max(rawPageSize, 1), 100);
  const offset = (page - 1) * pageSize;

  const conditions: ReturnType<typeof eq>[] = [eq(invoices.tenantId, ctx.tenantId)];

  if (status) {
    if (Array.isArray(status)) {
      conditions.push(inArray(invoices.status, status));
    } else {
      conditions.push(eq(invoices.status, status));
    }
  }

  if (customerId) {
    conditions.push(eq(invoices.customerId, customerId));
  }

  if (from) {
    conditions.push(gte(invoices.dueDate, from));
  }

  if (to) {
    conditions.push(lte(invoices.dueDate, to));
  }

  if (search) {
    const term = `%${search}%`;
    conditions.push(
      or(
        ilike(invoices.invoiceNumber, term),
        ilike(invoices.notes, term)
      )!
    );
  }

  const orderFn = order === "asc" ? asc : desc;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sortMap: Record<string, any> = {
    createdAt: invoices.createdAt,
    invoiceNumber: invoices.invoiceNumber,
    status: invoices.status,
    total: invoices.total,
    dueDate: invoices.dueDate,
    balanceDue: invoices.balanceDue,
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const sortColumn = sortMap[sort] ?? invoices.createdAt;

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        status: invoices.status,
        dueDate: invoices.dueDate,
        subtotal: invoices.subtotal,
        taxAmount: invoices.taxAmount,
        total: invoices.total,
        amountPaid: invoices.amountPaid,
        balanceDue: invoices.balanceDue,
        sentAt: invoices.sentAt,
        paidAt: invoices.paidAt,
        createdAt: invoices.createdAt,
        customerId: invoices.customerId,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
        jobId: invoices.jobId,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(and(...conditions))
      .orderBy(orderFn(sortColumn))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(and(...conditions)),
  ]);

  return {
    data,
    meta: { page, pageSize, total: Number(countResult[0].count) },
  };
}

// ---------- Get ----------

export async function getInvoice(ctx: UserContext, invoiceId: string) {
  assertPermission(ctx, "invoices", "read");

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.tenantId, ctx.tenantId)))
    .limit(1);

  if (!invoice) throw new NotFoundError("Invoice");
  return invoice;
}

export async function getInvoiceWithRelations(ctx: UserContext, invoiceId: string) {
  const invoice = await getInvoice(ctx, invoiceId);

  const [customer, createdByUser, lineItems, paymentList] = await Promise.all([
    db.select().from(customers).where(eq(customers.id, invoice.customerId)).limit(1).then((r) => r[0]),
    db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
      .from(users).where(eq(users.id, invoice.createdBy)).limit(1).then((r) => r[0]),
    db.select().from(invoiceLineItems)
      .where(and(eq(invoiceLineItems.invoiceId, invoiceId), eq(invoiceLineItems.tenantId, ctx.tenantId)))
      .orderBy(asc(invoiceLineItems.sortOrder)),
    db.select().from(payments)
      .where(and(eq(payments.invoiceId, invoiceId), eq(payments.tenantId, ctx.tenantId)))
      .orderBy(desc(payments.createdAt)),
  ]);

  // Fetch linked job if exists
  const linkedJob = invoice.jobId
    ? await db.select({ id: jobs.id, jobNumber: jobs.jobNumber, summary: jobs.summary, status: jobs.status })
        .from(jobs).where(eq(jobs.id, invoice.jobId)).limit(1).then((r) => r[0])
    : null;

  // Fetch linked estimate if exists
  const linkedEstimate = invoice.estimateId
    ? await db.select({ id: estimates.id, estimateNumber: estimates.estimateNumber, summary: estimates.summary, status: estimates.status })
        .from(estimates).where(eq(estimates.id, invoice.estimateId)).limit(1).then((r) => r[0])
    : null;

  return {
    ...invoice,
    customer,
    createdByUser,
    lineItems,
    payments: paymentList,
    linkedJob,
    linkedEstimate,
  };
}

// ---------- Create ----------

export async function createInvoice(ctx: UserContext, input: CreateInvoiceInput) {
  assertPermission(ctx, "invoices", "create");

  if (!input.lineItems || input.lineItems.length === 0) {
    throw new AppError("VALIDATION_ERROR", "At least one line item is required", 400);
  }

  const invoiceNumber = await getNextSequenceNumber(ctx.tenantId, "invoice");

  const result = await db.transaction(async (tx) => {
    // Validate customer belongs to tenant
    const [customer] = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, input.customerId), eq(customers.tenantId, ctx.tenantId)))
      .limit(1);
    if (!customer) throw new NotFoundError("Customer");

    // Validate job if linked
    if (input.jobId) {
      const [job] = await tx
        .select({ id: jobs.id })
        .from(jobs)
        .where(and(eq(jobs.id, input.jobId), eq(jobs.tenantId, ctx.tenantId)))
        .limit(1);
      if (!job) throw new NotFoundError("Job");
    }

    // Validate estimate if linked
    if (input.estimateId) {
      const [estimate] = await tx
        .select({ id: estimates.id })
        .from(estimates)
        .where(and(eq(estimates.id, input.estimateId), eq(estimates.tenantId, ctx.tenantId)))
        .limit(1);
      if (!estimate) throw new NotFoundError("Estimate");
    }

    // Calculate totals
    const subtotal = input.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const taxRate = input.taxRate ?? 0;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    const [invoice] = await tx
      .insert(invoices)
      .values({
        tenantId: ctx.tenantId,
        invoiceNumber,
        customerId: input.customerId,
        jobId: input.jobId || null,
        estimateId: input.estimateId || null,
        createdBy: ctx.userId,
        dueDate: input.dueDate,
        subtotal: String(subtotal),
        taxRate: String(taxRate),
        taxAmount: String(taxAmount),
        total: String(total),
        amountPaid: "0",
        balanceDue: String(total),
        notes: input.notes || null,
        internalNotes: input.internalNotes || null,
      })
      .returning();

    // Insert line items
    const items = input.lineItems.map((item, idx) => ({
      tenantId: ctx.tenantId,
      invoiceId: invoice.id,
      description: item.description,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
      total: String(item.quantity * item.unitPrice),
      type: (item.type || "service") as LineItemType,
      sortOrder: idx,
    }));
    await tx.insert(invoiceLineItems).values(items);

    return invoice;
  });

  await logActivity(ctx, "invoice", result.id, "created");
  return result;
}

// ---------- Update ----------

export async function updateInvoice(ctx: UserContext, invoiceId: string, input: UpdateInvoiceInput) {
  assertPermission(ctx, "invoices", "update");

  const invoice = await getInvoice(ctx, invoiceId);

  if (!["draft", "sent", "viewed"].includes(invoice.status)) {
    throw new AppError("INVALID_STATE", "Only draft, sent, or viewed invoices can be edited", 422);
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.internalNotes !== undefined) updateData.internalNotes = input.internalNotes;

  // If tax rate changes, recalculate
  if (input.taxRate !== undefined) {
    const subtotal = Number(invoice.subtotal);
    const taxAmount = subtotal * input.taxRate;
    const total = subtotal + taxAmount;
    const balanceDue = total - Number(invoice.amountPaid);

    updateData.taxRate = String(input.taxRate);
    updateData.taxAmount = String(taxAmount);
    updateData.total = String(total);
    updateData.balanceDue = String(balanceDue);
  }

  const [updated] = await db
    .update(invoices)
    .set(updateData)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.tenantId, ctx.tenantId)))
    .returning();

  await logActivity(ctx, "invoice", invoiceId, "updated");
  return updated;
}

// ---------- Line item management ----------

export async function addInvoiceLineItem(
  ctx: UserContext,
  invoiceId: string,
  input: { description: string; quantity: number; unitPrice: number; type?: LineItemType }
) {
  assertPermission(ctx, "invoices", "update");
  const invoice = await getInvoice(ctx, invoiceId);

  if (!["draft", "sent", "viewed"].includes(invoice.status)) {
    throw new AppError("INVALID_STATE", "Cannot add items to this invoice", 422);
  }

  const total = input.quantity * input.unitPrice;

  const maxSort = await db
    .select({ max: sql<number>`coalesce(max(${invoiceLineItems.sortOrder}), -1)` })
    .from(invoiceLineItems)
    .where(and(eq(invoiceLineItems.invoiceId, invoiceId), eq(invoiceLineItems.tenantId, ctx.tenantId)));

  const [item] = await db
    .insert(invoiceLineItems)
    .values({
      tenantId: ctx.tenantId,
      invoiceId,
      description: input.description,
      quantity: String(input.quantity),
      unitPrice: String(input.unitPrice),
      total: String(total),
      type: input.type || "service",
      sortOrder: Number(maxSort[0].max) + 1,
    })
    .returning();

  await recalculateInvoiceTotals(ctx.tenantId, invoiceId);
  return item;
}

export async function deleteInvoiceLineItem(ctx: UserContext, invoiceId: string, itemId: string) {
  assertPermission(ctx, "invoices", "update");
  const invoice = await getInvoice(ctx, invoiceId);

  if (!["draft", "sent", "viewed"].includes(invoice.status)) {
    throw new AppError("INVALID_STATE", "Cannot modify items on this invoice", 422);
  }

  await db
    .delete(invoiceLineItems)
    .where(
      and(
        eq(invoiceLineItems.id, itemId),
        eq(invoiceLineItems.invoiceId, invoiceId),
        eq(invoiceLineItems.tenantId, ctx.tenantId)
      )
    );

  await recalculateInvoiceTotals(ctx.tenantId, invoiceId);
}

async function recalculateInvoiceTotals(tenantId: string, invoiceId: string) {
  const [invoice] = await db
    .select({ taxRate: invoices.taxRate, amountPaid: invoices.amountPaid })
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  const result = await db
    .select({ sum: sql<string>`coalesce(sum(${invoiceLineItems.total}::numeric), 0)` })
    .from(invoiceLineItems)
    .where(and(eq(invoiceLineItems.invoiceId, invoiceId), eq(invoiceLineItems.tenantId, tenantId)));

  const subtotal = Number(result[0].sum);
  const taxRate = Number(invoice.taxRate);
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  const amountPaid = Number(invoice.amountPaid);
  const balanceDue = total - amountPaid;

  await db
    .update(invoices)
    .set({
      subtotal: String(subtotal),
      taxAmount: String(taxAmount),
      total: String(total),
      balanceDue: String(balanceDue),
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId));
}

// ---------- Status transitions ----------

export async function sendInvoice(ctx: UserContext, invoiceId: string) {
  assertPermission(ctx, "invoices", "update");
  const invoice = await getInvoice(ctx, invoiceId);

  if (invoice.status !== "draft") {
    throw new AppError("INVALID_STATE", "Only draft invoices can be sent", 422);
  }

  const [updated] = await db
    .update(invoices)
    .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
    .where(eq(invoices.id, invoiceId))
    .returning();

  await logActivity(ctx, "invoice", invoiceId, "sent");
  return updated;
}

export async function voidInvoice(ctx: UserContext, invoiceId: string) {
  assertPermission(ctx, "invoices", "update");
  const invoice = await getInvoice(ctx, invoiceId);

  if (invoice.status === "void") {
    throw new AppError("INVALID_STATE", "Invoice is already void", 422);
  }

  if (invoice.status === "paid") {
    throw new AppError("INVALID_STATE", "Cannot void a fully paid invoice", 422);
  }

  const [updated] = await db
    .update(invoices)
    .set({ status: "void", updatedAt: new Date() })
    .where(eq(invoices.id, invoiceId))
    .returning();

  await logActivity(ctx, "invoice", invoiceId, "voided");
  return updated;
}

// ---------- Payments ----------

export async function recordPayment(ctx: UserContext, invoiceId: string, input: RecordPaymentInput) {
  assertPermission(ctx, "payments", "create");

  const invoice = await getInvoice(ctx, invoiceId);

  if (["void", "paid"].includes(invoice.status)) {
    throw new AppError("INVALID_STATE", "Cannot record payment for this invoice", 422);
  }

  const balanceDue = Number(invoice.balanceDue);
  if (input.amount > balanceDue) {
    throw new AppError("VALIDATION_ERROR", `Payment amount ($${input.amount}) exceeds balance due ($${balanceDue})`, 400);
  }

  const result = await db.transaction(async (tx) => {
    // Record the payment
    const [payment] = await tx
      .insert(payments)
      .values({
        tenantId: ctx.tenantId,
        invoiceId,
        customerId: invoice.customerId,
        amount: String(input.amount),
        method: input.method,
        status: "succeeded" as PaymentStatus,
        referenceNumber: input.referenceNumber || null,
        notes: input.notes || null,
      })
      .returning();

    // Update invoice totals
    const newAmountPaid = Number(invoice.amountPaid) + input.amount;
    const newBalanceDue = Number(invoice.total) - newAmountPaid;
    const newStatus: InvoiceStatus = newBalanceDue <= 0 ? "paid" : "partial";

    await tx
      .update(invoices)
      .set({
        amountPaid: String(newAmountPaid),
        balanceDue: String(newBalanceDue),
        status: newStatus,
        paidAt: newBalanceDue <= 0 ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));

    return payment;
  });

  await logActivity(ctx, "payment", result.id, "recorded", {
    invoiceId,
    amount: input.amount,
    method: input.method,
  });

  return result;
}

// ---------- Generate from job ----------

export async function generateInvoiceFromJob(ctx: UserContext, jobId: string, dueDate: string, taxRate: number = 0) {
  assertPermission(ctx, "invoices", "create");
  assertPermission(ctx, "jobs", "read");

  const { jobLineItems: jobLineItemsTable } = await import("@/lib/db/schema");

  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, ctx.tenantId)))
    .limit(1);

  if (!job) throw new NotFoundError("Job");

  // Get job line items
  const items = await db
    .select()
    .from(jobLineItemsTable)
    .where(and(eq(jobLineItemsTable.jobId, jobId), eq(jobLineItemsTable.tenantId, ctx.tenantId)))
    .orderBy(asc(jobLineItemsTable.sortOrder));

  if (items.length === 0) {
    throw new AppError("VALIDATION_ERROR", "Job has no line items to invoice", 400);
  }

  return createInvoice(ctx, {
    customerId: job.customerId,
    jobId: job.id,
    dueDate,
    taxRate,
    lineItems: items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      type: item.type as LineItemType,
    })),
  });
}
