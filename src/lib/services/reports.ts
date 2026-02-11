import { db } from "@/lib/db";
import {
  jobs,
  invoices,
  payments,
  estimates,
  users,
  activityLog,
} from "@/lib/db/schema";
import {
  eq,
  and,
  sql,
  gte,
  lte,
  desc,
  asc,
  inArray,
  count,
} from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";

// ==================== Dashboard Stats ====================

export async function getDashboardStats(ctx: UserContext) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    todaysJobs,
    todaysCompleted,
    revenueMTD,
    invoicesPaidMTD,
    openEstimates,
    openEstimatesValue,
    overdueInvoices,
    overdueValue,
  ] = await Promise.all([
    // Today's jobs
    db
      .select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(
        and(
          eq(jobs.tenantId, ctx.tenantId),
          gte(jobs.scheduledStart, today),
          lte(jobs.scheduledStart, tomorrow),
          sql`${jobs.status} != 'canceled'`
        )
      )
      .then((r) => Number(r[0].count)),

    // Today's completed
    db
      .select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(
        and(
          eq(jobs.tenantId, ctx.tenantId),
          gte(jobs.completedAt, today),
          lte(jobs.completedAt, tomorrow)
        )
      )
      .then((r) => Number(r[0].count)),

    // Revenue MTD (from payments)
    db
      .select({ sum: sql<string>`coalesce(sum(${payments.amount}::numeric), 0)` })
      .from(payments)
      .where(
        and(
          eq(payments.tenantId, ctx.tenantId),
          eq(payments.status, "succeeded"),
          gte(payments.processedAt, monthStart)
        )
      )
      .then((r) => Number(r[0].sum)),

    // Invoices paid MTD
    db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.tenantId, ctx.tenantId),
          eq(invoices.status, "paid"),
          gte(invoices.paidAt, monthStart)
        )
      )
      .then((r) => Number(r[0].count)),

    // Open estimates count
    db
      .select({ count: sql<number>`count(*)` })
      .from(estimates)
      .where(
        and(
          eq(estimates.tenantId, ctx.tenantId),
          inArray(estimates.status, ["sent", "viewed"])
        )
      )
      .then((r) => Number(r[0].count)),

    // Open estimates total value
    db
      .select({ sum: sql<string>`coalesce(sum(${estimates.totalAmount}::numeric), 0)` })
      .from(estimates)
      .where(
        and(
          eq(estimates.tenantId, ctx.tenantId),
          inArray(estimates.status, ["sent", "viewed"])
        )
      )
      .then((r) => Number(r[0].sum)),

    // Overdue invoices count
    db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.tenantId, ctx.tenantId),
          inArray(invoices.status, ["sent", "viewed", "partial"]),
          lte(invoices.dueDate, today.toISOString().slice(0, 10))
        )
      )
      .then((r) => Number(r[0].count)),

    // Overdue balance
    db
      .select({ sum: sql<string>`coalesce(sum(${invoices.balanceDue}::numeric), 0)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.tenantId, ctx.tenantId),
          inArray(invoices.status, ["sent", "viewed", "partial"]),
          lte(invoices.dueDate, today.toISOString().slice(0, 10))
        )
      )
      .then((r) => Number(r[0].sum)),
  ]);

  return {
    todaysJobs,
    todaysCompleted,
    revenueMTD,
    invoicesPaidMTD,
    openEstimates,
    openEstimatesValue,
    overdueInvoices,
    overdueValue,
  };
}

// ==================== Recent Activity ====================

export async function getRecentActivity(ctx: UserContext, limit: number = 10) {
  const data = await db
    .select({
      id: activityLog.id,
      entityType: activityLog.entityType,
      entityId: activityLog.entityId,
      action: activityLog.action,
      createdAt: activityLog.createdAt,
      userId: activityLog.userId,
      userFirstName: users.firstName,
      userLastName: users.lastName,
    })
    .from(activityLog)
    .leftJoin(users, eq(activityLog.userId, users.id))
    .where(eq(activityLog.tenantId, ctx.tenantId))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);

  return data;
}

// ==================== Revenue Report ====================

export interface RevenueReportParams {
  from: string;
  to: string;
  groupBy?: "day" | "week" | "month";
}

export async function getRevenueReport(ctx: UserContext, params: RevenueReportParams) {
  assertPermission(ctx, "reports", "read");

  const { from, to, groupBy = "day" } = params;

  const truncExpr = groupBy === "month"
    ? sql`date_trunc('month', ${payments.processedAt})`
    : groupBy === "week"
    ? sql`date_trunc('week', ${payments.processedAt})`
    : sql`date_trunc('day', ${payments.processedAt})`;

  // Revenue by period
  const byPeriod = await db
    .select({
      period: truncExpr.as("period"),
      total: sql<string>`sum(${payments.amount}::numeric)`.as("total"),
      count: sql<number>`count(*)`.as("count"),
    })
    .from(payments)
    .where(
      and(
        eq(payments.tenantId, ctx.tenantId),
        eq(payments.status, "succeeded"),
        gte(payments.processedAt, new Date(from)),
        lte(payments.processedAt, new Date(to))
      )
    )
    .groupBy(truncExpr)
    .orderBy(asc(truncExpr));

  // Summary totals
  const [summary] = await db
    .select({
      totalRevenue: sql<string>`coalesce(sum(${payments.amount}::numeric), 0)`,
      paymentCount: sql<number>`count(*)`,
      avgPayment: sql<string>`coalesce(avg(${payments.amount}::numeric), 0)`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.tenantId, ctx.tenantId),
        eq(payments.status, "succeeded"),
        gte(payments.processedAt, new Date(from)),
        lte(payments.processedAt, new Date(to))
      )
    );

  // Revenue by payment method
  const byMethod = await db
    .select({
      method: payments.method,
      total: sql<string>`sum(${payments.amount}::numeric)`,
      count: sql<number>`count(*)`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.tenantId, ctx.tenantId),
        eq(payments.status, "succeeded"),
        gte(payments.processedAt, new Date(from)),
        lte(payments.processedAt, new Date(to))
      )
    )
    .groupBy(payments.method)
    .orderBy(desc(sql`sum(${payments.amount}::numeric)`));

  return {
    byPeriod: byPeriod.map((r) => ({
      period: r.period as string,
      total: Number(r.total),
      count: Number(r.count),
    })),
    summary: {
      totalRevenue: Number(summary.totalRevenue),
      paymentCount: Number(summary.paymentCount),
      avgPayment: Number(summary.avgPayment),
    },
    byMethod: byMethod.map((r) => ({
      method: r.method,
      total: Number(r.total),
      count: Number(r.count),
    })),
  };
}

// ==================== Jobs Report ====================

export interface JobsReportParams {
  from: string;
  to: string;
}

export async function getJobsReport(ctx: UserContext, params: JobsReportParams) {
  assertPermission(ctx, "reports", "read");

  const { from, to } = params;
  const fromDate = new Date(from);
  const toDate = new Date(to);

  // Jobs by status
  const byStatus = await db
    .select({
      status: jobs.status,
      count: sql<number>`count(*)`,
      totalAmount: sql<string>`coalesce(sum(${jobs.totalAmount}::numeric), 0)`,
    })
    .from(jobs)
    .where(
      and(
        eq(jobs.tenantId, ctx.tenantId),
        gte(jobs.createdAt, fromDate),
        lte(jobs.createdAt, toDate)
      )
    )
    .groupBy(jobs.status);

  // Jobs by type
  const byType = await db
    .select({
      jobType: jobs.jobType,
      count: sql<number>`count(*)`,
      totalAmount: sql<string>`coalesce(sum(${jobs.totalAmount}::numeric), 0)`,
    })
    .from(jobs)
    .where(
      and(
        eq(jobs.tenantId, ctx.tenantId),
        gte(jobs.createdAt, fromDate),
        lte(jobs.createdAt, toDate)
      )
    )
    .groupBy(jobs.jobType)
    .orderBy(desc(sql`count(*)`));

  // Jobs created by day
  const byDay = await db
    .select({
      day: sql`date_trunc('day', ${jobs.createdAt})`.as("day"),
      count: sql<number>`count(*)`,
    })
    .from(jobs)
    .where(
      and(
        eq(jobs.tenantId, ctx.tenantId),
        gte(jobs.createdAt, fromDate),
        lte(jobs.createdAt, toDate)
      )
    )
    .groupBy(sql`date_trunc('day', ${jobs.createdAt})`)
    .orderBy(asc(sql`date_trunc('day', ${jobs.createdAt})`));

  // Summary
  const [summary] = await db
    .select({
      total: sql<number>`count(*)`,
      completed: sql<number>`count(*) filter (where ${jobs.status} = 'completed')`,
      canceled: sql<number>`count(*) filter (where ${jobs.status} = 'canceled')`,
      totalRevenue: sql<string>`coalesce(sum(${jobs.totalAmount}::numeric), 0)`,
      avgJobValue: sql<string>`coalesce(avg(${jobs.totalAmount}::numeric), 0)`,
    })
    .from(jobs)
    .where(
      and(
        eq(jobs.tenantId, ctx.tenantId),
        gte(jobs.createdAt, fromDate),
        lte(jobs.createdAt, toDate)
      )
    );

  return {
    byStatus: byStatus.map((r) => ({
      status: r.status,
      count: Number(r.count),
      totalAmount: Number(r.totalAmount),
    })),
    byType: byType.map((r) => ({
      jobType: r.jobType,
      count: Number(r.count),
      totalAmount: Number(r.totalAmount),
    })),
    byDay: byDay.map((r) => ({
      day: r.day as string,
      count: Number(r.count),
    })),
    summary: {
      total: Number(summary.total),
      completed: Number(summary.completed),
      canceled: Number(summary.canceled),
      totalRevenue: Number(summary.totalRevenue),
      avgJobValue: Number(summary.avgJobValue),
    },
  };
}

// ==================== Invoice / AR Report ====================

export async function getInvoiceReport(ctx: UserContext, params: { from: string; to: string }) {
  assertPermission(ctx, "reports", "read");

  const fromDate = new Date(params.from);
  const toDate = new Date(params.to);
  const today = new Date().toISOString().slice(0, 10);

  // Invoices by status
  const byStatus = await db
    .select({
      status: invoices.status,
      count: sql<number>`count(*)`,
      totalAmount: sql<string>`coalesce(sum(${invoices.total}::numeric), 0)`,
      balanceDue: sql<string>`coalesce(sum(${invoices.balanceDue}::numeric), 0)`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.tenantId, ctx.tenantId),
        gte(invoices.createdAt, fromDate),
        lte(invoices.createdAt, toDate)
      )
    )
    .groupBy(invoices.status);

  // AR Aging buckets
  const aging = await db
    .select({
      bucket: sql<string>`
        case
          when ${invoices.dueDate} >= ${today} then 'current'
          when ${invoices.dueDate} >= (${today}::date - interval '30 days')::text then '1-30'
          when ${invoices.dueDate} >= (${today}::date - interval '60 days')::text then '31-60'
          when ${invoices.dueDate} >= (${today}::date - interval '90 days')::text then '61-90'
          else '90+'
        end
      `.as("bucket"),
      count: sql<number>`count(*)`,
      balance: sql<string>`coalesce(sum(${invoices.balanceDue}::numeric), 0)`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.tenantId, ctx.tenantId),
        inArray(invoices.status, ["sent", "viewed", "partial", "overdue"]),
        sql`${invoices.balanceDue}::numeric > 0`
      )
    )
    .groupBy(sql`
      case
        when ${invoices.dueDate} >= ${today} then 'current'
        when ${invoices.dueDate} >= (${today}::date - interval '30 days')::text then '1-30'
        when ${invoices.dueDate} >= (${today}::date - interval '60 days')::text then '31-60'
        when ${invoices.dueDate} >= (${today}::date - interval '90 days')::text then '61-90'
        else '90+'
      end
    `);

  // Summary
  const [summary] = await db
    .select({
      totalInvoiced: sql<string>`coalesce(sum(${invoices.total}::numeric), 0)`,
      totalPaid: sql<string>`coalesce(sum(${invoices.amountPaid}::numeric), 0)`,
      totalOutstanding: sql<string>`coalesce(sum(${invoices.balanceDue}::numeric), 0)`,
      invoiceCount: sql<number>`count(*)`,
      paidCount: sql<number>`count(*) filter (where ${invoices.status} = 'paid')`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.tenantId, ctx.tenantId),
        gte(invoices.createdAt, fromDate),
        lte(invoices.createdAt, toDate)
      )
    );

  return {
    byStatus: byStatus.map((r) => ({
      status: r.status,
      count: Number(r.count),
      totalAmount: Number(r.totalAmount),
      balanceDue: Number(r.balanceDue),
    })),
    aging: aging.map((r) => ({
      bucket: r.bucket,
      count: Number(r.count),
      balance: Number(r.balance),
    })),
    summary: {
      totalInvoiced: Number(summary.totalInvoiced),
      totalPaid: Number(summary.totalPaid),
      totalOutstanding: Number(summary.totalOutstanding),
      invoiceCount: Number(summary.invoiceCount),
      paidCount: Number(summary.paidCount),
    },
  };
}

// ==================== Technician Report ====================

export async function getTechnicianReport(ctx: UserContext, params: { from: string; to: string }) {
  assertPermission(ctx, "reports", "read");

  const fromDate = new Date(params.from);
  const toDate = new Date(params.to);

  // Stats per technician
  const techStats = await db
    .select({
      techId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      color: users.color,
      totalJobs: sql<number>`count(${jobs.id})`,
      completedJobs: sql<number>`count(${jobs.id}) filter (where ${jobs.status} = 'completed')`,
      totalRevenue: sql<string>`coalesce(sum(${jobs.totalAmount}::numeric) filter (where ${jobs.status} = 'completed'), 0)`,
      avgJobValue: sql<string>`coalesce(avg(${jobs.totalAmount}::numeric) filter (where ${jobs.status} = 'completed'), 0)`,
    })
    .from(users)
    .leftJoin(
      jobs,
      and(
        eq(jobs.assignedTo, users.id),
        gte(jobs.createdAt, fromDate),
        lte(jobs.createdAt, toDate)
      )
    )
    .where(
      and(
        eq(users.tenantId, ctx.tenantId),
        eq(users.canBeDispatched, true),
        eq(users.isActive, true)
      )
    )
    .groupBy(users.id, users.firstName, users.lastName, users.color)
    .orderBy(desc(sql`count(${jobs.id}) filter (where ${jobs.status} = 'completed')`));

  return {
    technicians: techStats.map((r) => ({
      id: r.techId,
      firstName: r.firstName,
      lastName: r.lastName,
      color: r.color,
      totalJobs: Number(r.totalJobs),
      completedJobs: Number(r.completedJobs),
      totalRevenue: Number(r.totalRevenue),
      avgJobValue: Number(r.avgJobValue),
    })),
  };
}
