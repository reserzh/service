import { cache } from "react";
import { db } from "./db";
import {
  jobs,
  jobPhotos,
  invoices,
  invoiceLineItems,
  estimates,
  estimateOptions,
  estimateOptionItems,
  agreements,
  agreementServices,
  agreementVisits,
  properties,
  payments,
} from "@fieldservice/shared/db/schema";
import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import type { CustomerPortalContext } from "@fieldservice/api-types/models";

// ---------- Jobs ----------

export const getPortalJobs = cache(async (ctx: CustomerPortalContext) => {
  return db
    .select({
      id: jobs.id,
      jobNumber: jobs.jobNumber,
      summary: jobs.summary,
      status: jobs.status,
      priority: jobs.priority,
      jobType: jobs.jobType,
      scheduledStart: jobs.scheduledStart,
      scheduledEnd: jobs.scheduledEnd,
      completedAt: jobs.completedAt,
      createdAt: jobs.createdAt,
      propertyAddress: properties.addressLine1,
      propertyCity: properties.city,
      propertyState: properties.state,
    })
    .from(jobs)
    .leftJoin(properties, and(eq(jobs.propertyId, properties.id), eq(properties.tenantId, ctx.tenantId)))
    .where(and(eq(jobs.customerId, ctx.customerId), eq(jobs.tenantId, ctx.tenantId)))
    .orderBy(desc(jobs.createdAt));
});

export const getPortalJob = cache(async (ctx: CustomerPortalContext, jobId: string) => {
  const [job] = await db
    .select({
      id: jobs.id,
      jobNumber: jobs.jobNumber,
      summary: jobs.summary,
      description: jobs.description,
      status: jobs.status,
      priority: jobs.priority,
      jobType: jobs.jobType,
      scheduledStart: jobs.scheduledStart,
      scheduledEnd: jobs.scheduledEnd,
      completedAt: jobs.completedAt,
      customerNotes: jobs.customerNotes,
      createdAt: jobs.createdAt,
      propertyAddress: properties.addressLine1,
      propertyCity: properties.city,
      propertyState: properties.state,
      propertyZip: properties.zip,
    })
    .from(jobs)
    .leftJoin(properties, and(eq(jobs.propertyId, properties.id), eq(properties.tenantId, ctx.tenantId)))
    .where(and(eq(jobs.id, jobId), eq(jobs.customerId, ctx.customerId), eq(jobs.tenantId, ctx.tenantId)))
    .limit(1);

  return job ?? null;
});

// Get photos for a portal job (only general and after types — not internal before photos)
export const getPortalJobPhotos = cache(async (ctx: CustomerPortalContext, jobId: string) => {
  // Verify the job belongs to this customer first
  const job = await getPortalJob(ctx, jobId);
  if (!job) return [];

  return db
    .select({
      id: jobPhotos.id,
      storagePath: jobPhotos.storagePath,
      caption: jobPhotos.caption,
      photoType: jobPhotos.photoType,
      takenAt: jobPhotos.takenAt,
      createdAt: jobPhotos.createdAt,
    })
    .from(jobPhotos)
    .where(
      and(
        eq(jobPhotos.jobId, jobId),
        eq(jobPhotos.tenantId, ctx.tenantId),
        inArray(jobPhotos.photoType, ["general", "after"])
      )
    )
    .orderBy(desc(jobPhotos.createdAt));
});

// ---------- Invoices ----------

export const getPortalInvoices = cache(async (ctx: CustomerPortalContext) => {
  return db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      dueDate: invoices.dueDate,
      total: invoices.total,
      balanceDue: invoices.balanceDue,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .where(and(eq(invoices.customerId, ctx.customerId), eq(invoices.tenantId, ctx.tenantId)))
    .orderBy(desc(invoices.createdAt));
});

export const getPortalInvoice = cache(async (ctx: CustomerPortalContext, invoiceId: string) => {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.customerId, ctx.customerId), eq(invoices.tenantId, ctx.tenantId)))
    .limit(1);

  if (!invoice) return null;

  const [lineItemsData, paymentsData] = await Promise.all([
    db.select().from(invoiceLineItems).where(and(eq(invoiceLineItems.invoiceId, invoiceId), eq(invoiceLineItems.tenantId, ctx.tenantId))).orderBy(asc(invoiceLineItems.sortOrder)),
    db.select().from(payments).where(and(eq(payments.invoiceId, invoiceId), eq(payments.tenantId, ctx.tenantId))).orderBy(desc(payments.processedAt)),
  ]);

  return { ...invoice, lineItems: lineItemsData, payments: paymentsData };
});

// ---------- Estimates ----------

export const getPortalEstimates = cache(async (ctx: CustomerPortalContext) => {
  return db
    .select({
      id: estimates.id,
      estimateNumber: estimates.estimateNumber,
      summary: estimates.summary,
      status: estimates.status,
      totalAmount: estimates.totalAmount,
      validUntil: estimates.validUntil,
      createdAt: estimates.createdAt,
    })
    .from(estimates)
    .where(and(eq(estimates.customerId, ctx.customerId), eq(estimates.tenantId, ctx.tenantId)))
    .orderBy(desc(estimates.createdAt));
});

export const getPortalEstimate = cache(async (ctx: CustomerPortalContext, estimateId: string) => {
  const [estimate] = await db
    .select()
    .from(estimates)
    .where(and(eq(estimates.id, estimateId), eq(estimates.customerId, ctx.customerId), eq(estimates.tenantId, ctx.tenantId)))
    .limit(1);

  if (!estimate) return null;

  const options = await db
    .select()
    .from(estimateOptions)
    .where(and(eq(estimateOptions.estimateId, estimateId), eq(estimateOptions.tenantId, ctx.tenantId)))
    .orderBy(asc(estimateOptions.sortOrder));

  const optionIds = options.map((o) => o.id);
  let items: (typeof estimateOptionItems.$inferSelect)[] = [];
  if (optionIds.length > 0) {
    items = await db
      .select()
      .from(estimateOptionItems)
      .where(and(inArray(estimateOptionItems.optionId, optionIds), eq(estimateOptionItems.tenantId, ctx.tenantId)))
      .orderBy(asc(estimateOptionItems.sortOrder));
  }

  const optionsWithItems = options.map((opt) => ({
    ...opt,
    items: items.filter((item) => item.optionId === opt.id),
  }));

  return { ...estimate, options: optionsWithItems };
});

// ---------- Agreements ----------

export const getPortalAgreements = cache(async (ctx: CustomerPortalContext) => {
  return db
    .select({
      id: agreements.id,
      agreementNumber: agreements.agreementNumber,
      name: agreements.name,
      status: agreements.status,
      startDate: agreements.startDate,
      endDate: agreements.endDate,
      billingFrequency: agreements.billingFrequency,
      totalValue: agreements.totalValue,
      createdAt: agreements.createdAt,
    })
    .from(agreements)
    .where(and(eq(agreements.customerId, ctx.customerId), eq(agreements.tenantId, ctx.tenantId)))
    .orderBy(desc(agreements.createdAt));
});

export const getPortalAgreement = cache(async (ctx: CustomerPortalContext, agreementId: string) => {
  const [agreement] = await db
    .select()
    .from(agreements)
    .where(and(eq(agreements.id, agreementId), eq(agreements.customerId, ctx.customerId), eq(agreements.tenantId, ctx.tenantId)))
    .limit(1);

  if (!agreement) return null;

  const [services, visits] = await Promise.all([
    db.select().from(agreementServices).where(and(eq(agreementServices.agreementId, agreementId), eq(agreementServices.tenantId, ctx.tenantId))).orderBy(asc(agreementServices.sortOrder)),
    db.select().from(agreementVisits).where(and(eq(agreementVisits.agreementId, agreementId), eq(agreementVisits.tenantId, ctx.tenantId))).orderBy(asc(agreementVisits.visitNumber)),
  ]);

  return { ...agreement, services, visits };
});

// ---------- Dashboard Summary ----------

export const getPortalDashboard = cache(async (ctx: CustomerPortalContext) => {
  const [jobCount, openInvoices, pendingEstimates, activeAgreements] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(jobs)
      .where(and(eq(jobs.customerId, ctx.customerId), eq(jobs.tenantId, ctx.tenantId)))
      .then((r) => Number(r[0].count)),
    db.select({ count: sql<number>`count(*)`, total: sql<string>`COALESCE(sum(${invoices.balanceDue}), 0)` }).from(invoices)
      .where(and(eq(invoices.customerId, ctx.customerId), eq(invoices.tenantId, ctx.tenantId), sql`${invoices.status} IN ('sent', 'viewed', 'overdue')`))
      .then((r) => ({ count: Number(r[0].count), total: r[0].total })),
    db.select({ count: sql<number>`count(*)` }).from(estimates)
      .where(and(eq(estimates.customerId, ctx.customerId), eq(estimates.tenantId, ctx.tenantId), sql`${estimates.status} IN ('sent', 'viewed')`))
      .then((r) => Number(r[0].count)),
    db.select({ count: sql<number>`count(*)` }).from(agreements)
      .where(and(eq(agreements.customerId, ctx.customerId), eq(agreements.tenantId, ctx.tenantId), eq(agreements.status, "active")))
      .then((r) => Number(r[0].count)),
  ]);

  return { jobCount, openInvoices, pendingEstimates, activeAgreements };
});
