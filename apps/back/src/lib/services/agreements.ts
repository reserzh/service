import { db } from "@/lib/db";
import {
  agreements,
  agreementServices,
  agreementVisits,
  customers,
  properties,
  jobs,
  invoices,
  jobLineItems,
  invoiceLineItems,
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
import { escapeLike } from "@/lib/utils";
import { NotFoundError, AppError } from "@/lib/api/errors";
import { getNextSequenceNumber } from "./sequences";
import type { AgreementStatus, BillingFrequency } from "@fieldservice/api-types/enums";
import { VALID_AGREEMENT_TRANSITIONS } from "@fieldservice/api-types/constants";

// ---------- Types ----------

export interface ListAgreementsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: AgreementStatus | AgreementStatus[];
  customerId?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export interface CreateAgreementServiceInput {
  pricebookItemId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateAgreementInput {
  customerId: string;
  propertyId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  billingFrequency: BillingFrequency;
  billingAmount: number;
  totalValue: number;
  visitsPerYear: number;
  autoRenew?: boolean;
  renewalReminderDays?: number;
  notes?: string;
  internalNotes?: string;
  services?: CreateAgreementServiceInput[];
}

export interface UpdateAgreementInput {
  name?: string;
  description?: string | null;
  startDate?: string;
  endDate?: string;
  billingFrequency?: BillingFrequency;
  billingAmount?: number;
  totalValue?: number;
  visitsPerYear?: number;
  autoRenew?: boolean;
  renewalReminderDays?: number;
  notes?: string | null;
  internalNotes?: string | null;
}

// ---------- List ----------

export async function listAgreements(ctx: UserContext, params: ListAgreementsParams = {}) {
  assertPermission(ctx, "agreements", "read");

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

  const conditions: ReturnType<typeof eq>[] = [eq(agreements.tenantId, ctx.tenantId)];

  if (status) {
    if (Array.isArray(status)) {
      conditions.push(inArray(agreements.status, status));
    } else {
      conditions.push(eq(agreements.status, status));
    }
  }

  if (customerId) {
    conditions.push(eq(agreements.customerId, customerId));
  }

  if (search) {
    const term = `%${escapeLike(search)}%`;
    conditions.push(
      or(
        ilike(agreements.name, term),
        ilike(agreements.agreementNumber, term)
      )!
    );
  }

  const orderFn = order === "asc" ? asc : desc;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sortMap: Record<string, any> = {
    createdAt: agreements.createdAt,
    name: agreements.name,
    status: agreements.status,
    startDate: agreements.startDate,
    endDate: agreements.endDate,
    agreementNumber: agreements.agreementNumber,
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const sortColumn = sortMap[sort] ?? agreements.createdAt;

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: agreements.id,
        agreementNumber: agreements.agreementNumber,
        name: agreements.name,
        status: agreements.status,
        startDate: agreements.startDate,
        endDate: agreements.endDate,
        billingFrequency: agreements.billingFrequency,
        billingAmount: agreements.billingAmount,
        totalValue: agreements.totalValue,
        visitsPerYear: agreements.visitsPerYear,
        autoRenew: agreements.autoRenew,
        createdAt: agreements.createdAt,
        customerId: agreements.customerId,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
      })
      .from(agreements)
      .leftJoin(customers, and(eq(agreements.customerId, customers.id), eq(customers.tenantId, ctx.tenantId)))
      .where(and(...conditions))
      .orderBy(orderFn(sortColumn))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(agreements)
      .where(and(...conditions)),
  ]);

  return {
    data,
    meta: { page, pageSize, total: Number(countResult[0].count) },
  };
}

// ---------- Get ----------

export async function getAgreement(ctx: UserContext, agreementId: string) {
  assertPermission(ctx, "agreements", "read");

  const [agreement] = await db
    .select()
    .from(agreements)
    .where(and(eq(agreements.id, agreementId), eq(agreements.tenantId, ctx.tenantId)))
    .limit(1);

  if (!agreement) throw new NotFoundError("Agreement");
  return agreement;
}

export async function getAgreementWithRelations(ctx: UserContext, agreementId: string) {
  const agreement = await getAgreement(ctx, agreementId);

  const [customer, property, services, visits] = await Promise.all([
    db.select().from(customers).where(and(eq(customers.id, agreement.customerId), eq(customers.tenantId, ctx.tenantId))).limit(1).then((r) => r[0]),
    db.select().from(properties).where(and(eq(properties.id, agreement.propertyId), eq(properties.tenantId, ctx.tenantId))).limit(1).then((r) => r[0]),
    db.select().from(agreementServices)
      .where(and(eq(agreementServices.agreementId, agreementId), eq(agreementServices.tenantId, ctx.tenantId)))
      .orderBy(asc(agreementServices.sortOrder)),
    db.select().from(agreementVisits)
      .where(and(eq(agreementVisits.agreementId, agreementId), eq(agreementVisits.tenantId, ctx.tenantId)))
      .orderBy(asc(agreementVisits.visitNumber)),
  ]);

  return { ...agreement, customer, property, services, visits };
}

// ---------- Create ----------

export async function createAgreement(ctx: UserContext, input: CreateAgreementInput) {
  assertPermission(ctx, "agreements", "create");

  const result = await db.transaction(async (tx) => {
    const agreementNumber = await getNextSequenceNumber(ctx.tenantId, "agreement", tx);

    // Validate customer
    const [customer] = await tx.select({ id: customers.id }).from(customers)
      .where(and(eq(customers.id, input.customerId), eq(customers.tenantId, ctx.tenantId))).limit(1);
    if (!customer) throw new NotFoundError("Customer");

    // Validate property
    const [property] = await tx.select({ id: properties.id }).from(properties)
      .where(and(eq(properties.id, input.propertyId), eq(properties.tenantId, ctx.tenantId))).limit(1);
    if (!property) throw new NotFoundError("Property");

    const [agreement] = await tx
      .insert(agreements)
      .values({
        tenantId: ctx.tenantId,
        agreementNumber,
        customerId: input.customerId,
        propertyId: input.propertyId,
        name: input.name,
        description: input.description || null,
        startDate: input.startDate,
        endDate: input.endDate,
        billingFrequency: input.billingFrequency,
        billingAmount: String(input.billingAmount),
        totalValue: String(input.totalValue),
        visitsPerYear: input.visitsPerYear,
        autoRenew: input.autoRenew ?? false,
        renewalReminderDays: input.renewalReminderDays ?? 30,
        notes: input.notes || null,
        internalNotes: input.internalNotes || null,
        createdBy: ctx.userId,
      })
      .returning();

    // Insert services
    if (input.services && input.services.length > 0) {
      await tx.insert(agreementServices).values(
        input.services.map((svc, idx) => ({
          tenantId: ctx.tenantId,
          agreementId: agreement.id,
          pricebookItemId: svc.pricebookItemId || null,
          name: svc.name,
          description: svc.description || null,
          quantity: String(svc.quantity),
          unitPrice: String(svc.unitPrice),
          sortOrder: idx,
        }))
      );
    }

    // Generate visit schedule
    if (input.visitsPerYear > 0) {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      const intervalMs = (endDate.getTime() - startDate.getTime()) / input.visitsPerYear;

      const visitValues = Array.from({ length: input.visitsPerYear }, (_, i) => {
        const visitDate = new Date(startDate.getTime() + intervalMs * i);
        return {
          tenantId: ctx.tenantId,
          agreementId: agreement.id,
          visitNumber: i + 1,
          scheduledDate: visitDate.toISOString().split("T")[0],
          status: "scheduled" as const,
        };
      });

      await tx.insert(agreementVisits).values(visitValues);
    }

    return agreement;
  });

  await logActivity(ctx, "agreement", result.id, "created");
  return result;
}

// ---------- Update ----------

export async function updateAgreement(ctx: UserContext, agreementId: string, input: UpdateAgreementInput) {
  assertPermission(ctx, "agreements", "update");

  const agreement = await getAgreement(ctx, agreementId);

  if (agreement.status !== "draft") {
    throw new AppError("INVALID_STATE", "Only draft agreements can be edited", 422);
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.startDate !== undefined) updateData.startDate = input.startDate;
  if (input.endDate !== undefined) updateData.endDate = input.endDate;
  if (input.billingFrequency !== undefined) updateData.billingFrequency = input.billingFrequency;
  if (input.billingAmount !== undefined) updateData.billingAmount = String(input.billingAmount);
  if (input.totalValue !== undefined) updateData.totalValue = String(input.totalValue);
  if (input.visitsPerYear !== undefined) updateData.visitsPerYear = input.visitsPerYear;
  if (input.autoRenew !== undefined) updateData.autoRenew = input.autoRenew;
  if (input.renewalReminderDays !== undefined) updateData.renewalReminderDays = input.renewalReminderDays;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.internalNotes !== undefined) updateData.internalNotes = input.internalNotes;

  const [updated] = await db
    .update(agreements)
    .set(updateData)
    .where(and(eq(agreements.id, agreementId), eq(agreements.tenantId, ctx.tenantId)))
    .returning();

  await logActivity(ctx, "agreement", agreementId, "updated");
  return updated;
}

// ---------- Update agreement services ----------

export async function updateAgreementServices(
  ctx: UserContext,
  agreementId: string,
  services: CreateAgreementServiceInput[]
) {
  assertPermission(ctx, "agreements", "update");

  const agreement = await getAgreement(ctx, agreementId);

  if (agreement.status !== "draft") {
    throw new AppError("INVALID_STATE", "Only draft agreements can have services edited", 422);
  }

  await db.transaction(async (tx) => {
    // Delete existing services
    await tx
      .delete(agreementServices)
      .where(and(eq(agreementServices.agreementId, agreementId), eq(agreementServices.tenantId, ctx.tenantId)));

    // Insert new services
    if (services.length > 0) {
      await tx.insert(agreementServices).values(
        services.map((svc, idx) => ({
          tenantId: ctx.tenantId,
          agreementId,
          pricebookItemId: svc.pricebookItemId || null,
          name: svc.name,
          description: svc.description || null,
          quantity: String(svc.quantity),
          unitPrice: String(svc.unitPrice),
          sortOrder: idx,
        }))
      );
    }
  });

  await logActivity(ctx, "agreement", agreementId, "services_updated");
}

// ---------- Status transitions ----------

export async function changeAgreementStatus(ctx: UserContext, agreementId: string, newStatus: AgreementStatus) {
  assertPermission(ctx, "agreements", "update");

  const agreement = await getAgreement(ctx, agreementId);
  const currentStatus = agreement.status as AgreementStatus;

  const allowed = VALID_AGREEMENT_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new AppError(
      "INVALID_STATUS_TRANSITION",
      `Cannot transition from "${currentStatus}" to "${newStatus}"`,
      422
    );
  }

  const updateData: Record<string, unknown> = { status: newStatus, updatedAt: new Date() };
  if (newStatus === "active") updateData.activatedAt = new Date();
  if (newStatus === "paused") updateData.pausedAt = new Date();
  if (newStatus === "canceled") updateData.canceledAt = new Date();
  if (newStatus === "completed") updateData.completedAt = new Date();

  const [updated] = await db
    .update(agreements)
    .set(updateData)
    .where(and(eq(agreements.id, agreementId), eq(agreements.tenantId, ctx.tenantId)))
    .returning();

  await logActivity(ctx, "agreement", agreementId, "status_changed", {
    from: currentStatus,
    to: newStatus,
  });

  return updated;
}

// ---------- Visit management ----------

export async function getAgreementVisits(ctx: UserContext, agreementId: string) {
  assertPermission(ctx, "agreements", "read");
  await getAgreement(ctx, agreementId);

  return db.select().from(agreementVisits)
    .where(and(eq(agreementVisits.agreementId, agreementId), eq(agreementVisits.tenantId, ctx.tenantId)))
    .orderBy(asc(agreementVisits.visitNumber));
}

export async function generateVisitJob(ctx: UserContext, agreementId: string, visitId: string) {
  assertPermission(ctx, "agreements", "update");
  assertPermission(ctx, "jobs", "create");

  const agreement = await getAgreement(ctx, agreementId);

  if (agreement.status !== "active") {
    throw new AppError("INVALID_STATE", "Agreement must be active to generate jobs", 422);
  }

  const [visit] = await db.select().from(agreementVisits)
    .where(and(eq(agreementVisits.id, visitId), eq(agreementVisits.agreementId, agreementId), eq(agreementVisits.tenantId, ctx.tenantId)))
    .limit(1);
  if (!visit) throw new NotFoundError("Visit");

  if (visit.jobId) {
    throw new AppError("INVALID_STATE", "A job already exists for this visit", 422);
  }

  // Get agreement services for line items
  const services = await db.select().from(agreementServices)
    .where(and(eq(agreementServices.agreementId, agreementId), eq(agreementServices.tenantId, ctx.tenantId)))
    .orderBy(asc(agreementServices.sortOrder));

  const { createJob } = await import("./jobs");
  const job = await createJob(ctx, {
    customerId: agreement.customerId,
    propertyId: agreement.propertyId,
    jobType: "maintenance",
    summary: `${agreement.name} — Visit ${visit.visitNumber}`,
    description: agreement.description || undefined,
    scheduledStart: visit.scheduledDate ? new Date(visit.scheduledDate).toISOString() : undefined,
    lineItems: services.map((svc) => ({
      description: svc.name,
      quantity: Number(svc.quantity),
      unitPrice: Number(svc.unitPrice),
      type: "service" as const,
    })),
  });

  // Link visit to job
  await db
    .update(agreementVisits)
    .set({ jobId: job.id, updatedAt: new Date() })
    .where(and(eq(agreementVisits.id, visitId), eq(agreementVisits.tenantId, ctx.tenantId)));

  // Update job with agreement references
  await db
    .update(jobs)
    .set({ agreementId: agreement.id, agreementVisitId: visit.id })
    .where(and(eq(jobs.id, job.id), eq(jobs.tenantId, ctx.tenantId)));

  return job;
}

export async function completeVisit(ctx: UserContext, agreementId: string, visitId: string) {
  assertPermission(ctx, "agreements", "update");

  const agreement = await getAgreement(ctx, agreementId);

  const [visit] = await db.select().from(agreementVisits)
    .where(and(eq(agreementVisits.id, visitId), eq(agreementVisits.agreementId, agreementId), eq(agreementVisits.tenantId, ctx.tenantId)))
    .limit(1);
  if (!visit) throw new NotFoundError("Visit");

  await db
    .update(agreementVisits)
    .set({
      status: "completed",
      completedDate: new Date().toISOString().split("T")[0],
      updatedAt: new Date(),
    })
    .where(and(eq(agreementVisits.id, visitId), eq(agreementVisits.tenantId, ctx.tenantId)));

  // Auto-generate invoice from agreement services
  try {
    const services = await db.select().from(agreementServices)
      .where(and(eq(agreementServices.agreementId, agreementId), eq(agreementServices.tenantId, ctx.tenantId)))
      .orderBy(asc(agreementServices.sortOrder));

    if (services.length > 0) {
      const { createInvoice } = await import("./invoices");
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const invoice = await createInvoice(ctx, {
        customerId: agreement.customerId,
        jobId: visit.jobId || undefined,
        dueDate: dueDate.toISOString().split("T")[0],
        lineItems: services.map((svc) => ({
          description: svc.name,
          quantity: Number(svc.quantity),
          unitPrice: Number(svc.unitPrice),
          type: "service" as const,
        })),
      });

      // Update invoice with agreement reference
      await db
        .update(invoices)
        .set({ agreementId: agreement.id })
        .where(and(eq(invoices.id, invoice.id), eq(invoices.tenantId, ctx.tenantId)));

      // Link invoice to visit
      await db
        .update(agreementVisits)
        .set({ invoiceId: invoice.id })
        .where(and(eq(agreementVisits.id, visitId), eq(agreementVisits.tenantId, ctx.tenantId)));
    }
  } catch (error) {
    console.error("[Agreement] Failed to auto-generate invoice:", error);
  }

  await logActivity(ctx, "agreement", agreementId, "visit_completed", { visitNumber: visit.visitNumber });
}

// ---------- Renewal ----------

export async function renewAgreement(ctx: UserContext, agreementId: string) {
  assertPermission(ctx, "agreements", "create");

  const agreement = await getAgreement(ctx, agreementId);

  if (!["completed", "active"].includes(agreement.status)) {
    throw new AppError("INVALID_STATE", "Only active or completed agreements can be renewed", 422);
  }

  // Calculate new dates
  const oldEnd = new Date(agreement.endDate);
  const oldStart = new Date(agreement.startDate);
  const durationMs = oldEnd.getTime() - oldStart.getTime();
  const newStart = new Date(oldEnd.getTime() + 86400000); // Day after old end
  const newEnd = new Date(newStart.getTime() + durationMs);

  // Get services from original
  const services = await db.select().from(agreementServices)
    .where(and(eq(agreementServices.agreementId, agreementId), eq(agreementServices.tenantId, ctx.tenantId)))
    .orderBy(asc(agreementServices.sortOrder));

  const newAgreement = await createAgreement(ctx, {
    customerId: agreement.customerId,
    propertyId: agreement.propertyId,
    name: agreement.name,
    description: agreement.description || undefined,
    startDate: newStart.toISOString().split("T")[0],
    endDate: newEnd.toISOString().split("T")[0],
    billingFrequency: agreement.billingFrequency as BillingFrequency,
    billingAmount: Number(agreement.billingAmount),
    totalValue: Number(agreement.totalValue),
    visitsPerYear: agreement.visitsPerYear,
    autoRenew: agreement.autoRenew,
    renewalReminderDays: agreement.renewalReminderDays,
    notes: agreement.notes || undefined,
    internalNotes: agreement.internalNotes || undefined,
    services: services.map((svc) => ({
      pricebookItemId: svc.pricebookItemId || undefined,
      name: svc.name,
      description: svc.description || undefined,
      quantity: Number(svc.quantity),
      unitPrice: Number(svc.unitPrice),
    })),
  });

  await logActivity(ctx, "agreement", newAgreement.id, "renewed_from", { originalId: agreementId });
  return newAgreement;
}
