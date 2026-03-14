import { db } from "@/lib/db";
import {
  jobs,
  jobLineItems,
  jobDailySnapshots,
  users,
} from "@fieldservice/shared/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { NotFoundError } from "@/lib/api/errors";

export interface JobCostingResult {
  jobId: string;
  estimateBudget: number;
  actualLaborHours: number;
  actualLaborCost: number;
  actualMaterialCost: number;
  totalActualCost: number;
  profitLoss: number;
  profitMargin: number;
  daysScheduled: number;
  daysElapsed: number;
  budgetUsedPercent: number;
  snapshots: {
    date: string;
    completionPercent: number | null;
    laborCost: number;
    materialCost: number;
    notes: string | null;
  }[];
}

export async function getJobCosting(
  ctx: UserContext,
  jobId: string
): Promise<JobCostingResult> {
  assertPermission(ctx, "jobs", "read");

  // Get job
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, ctx.tenantId)))
    .limit(1);

  if (!job) throw new NotFoundError("Job");

  // Get estimate budget (sum of line items)
  const [budgetResult] = await db
    .select({ sum: sql<string>`coalesce(sum(${jobLineItems.total}::numeric), 0)` })
    .from(jobLineItems)
    .where(and(eq(jobLineItems.jobId, jobId), eq(jobLineItems.tenantId, ctx.tenantId)));

  const estimateBudget = Number(budgetResult.sum);

  // Get material costs from line items
  const [materialResult] = await db
    .select({ sum: sql<string>`coalesce(sum(${jobLineItems.total}::numeric), 0)` })
    .from(jobLineItems)
    .where(
      and(
        eq(jobLineItems.jobId, jobId),
        eq(jobLineItems.tenantId, ctx.tenantId),
        eq(jobLineItems.type, "material")
      )
    );

  const actualMaterialCost = Number(materialResult.sum);

  // Calculate labor hours from actualStart/actualEnd
  let actualLaborHours = 0;
  let actualLaborCost = 0;

  if (job.actualStart) {
    const end = job.actualEnd ? new Date(job.actualEnd) : new Date();
    const start = new Date(job.actualStart);
    actualLaborHours = Math.max(0, (end.getTime() - start.getTime()) / 3600000);

    // Get hourly rate for assigned tech
    if (job.assignedTo) {
      const [tech] = await db
        .select({ hourlyRate: users.hourlyRate })
        .from(users)
        .where(and(eq(users.id, job.assignedTo), eq(users.tenantId, ctx.tenantId)))
        .limit(1);

      const rate = tech?.hourlyRate ? Number(tech.hourlyRate) : 0;
      actualLaborCost = actualLaborHours * rate;
    }
  }

  // Calculate days
  let daysScheduled = 1;
  let daysElapsed = 0;
  if (job.scheduledStart && job.scheduledEnd) {
    daysScheduled = Math.max(
      1,
      Math.ceil((new Date(job.scheduledEnd).getTime() - new Date(job.scheduledStart).getTime()) / 86400000)
    );
  }
  if (job.actualStart) {
    const end = job.actualEnd ? new Date(job.actualEnd) : new Date();
    daysElapsed = Math.max(1, Math.ceil((end.getTime() - new Date(job.actualStart).getTime()) / 86400000));
  }

  const totalActualCost = actualLaborCost + actualMaterialCost;
  const profitLoss = estimateBudget - totalActualCost;
  const profitMargin = estimateBudget > 0 ? (profitLoss / estimateBudget) * 100 : 0;
  const budgetUsedPercent = estimateBudget > 0 ? (totalActualCost / estimateBudget) * 100 : 0;

  // Get snapshots
  const snapshots = await db
    .select({
      date: jobDailySnapshots.snapshotDate,
      completionPercent: jobDailySnapshots.completionPercent,
      laborCost: jobDailySnapshots.laborCost,
      materialCost: jobDailySnapshots.materialCost,
      notes: jobDailySnapshots.notes,
    })
    .from(jobDailySnapshots)
    .where(and(eq(jobDailySnapshots.jobId, jobId), eq(jobDailySnapshots.tenantId, ctx.tenantId)))
    .orderBy(desc(jobDailySnapshots.snapshotDate));

  return {
    jobId,
    estimateBudget,
    actualLaborHours: Math.round(actualLaborHours * 100) / 100,
    actualLaborCost: Math.round(actualLaborCost * 100) / 100,
    actualMaterialCost,
    totalActualCost: Math.round(totalActualCost * 100) / 100,
    profitLoss: Math.round(profitLoss * 100) / 100,
    profitMargin: Math.round(profitMargin * 10) / 10,
    daysScheduled,
    daysElapsed,
    budgetUsedPercent: Math.round(budgetUsedPercent * 10) / 10,
    snapshots: snapshots.map((s) => ({
      date: s.date,
      completionPercent: s.completionPercent,
      laborCost: Number(s.laborCost ?? 0),
      materialCost: Number(s.materialCost ?? 0),
      notes: s.notes,
    })),
  };
}

export async function createDailySnapshot(
  ctx: UserContext,
  jobId: string,
  input: { completionPercent?: number; notes?: string }
) {
  assertPermission(ctx, "jobs", "update");

  const today = new Date().toISOString().split("T")[0];

  // Get current costs
  const costing = await getJobCosting(ctx, jobId);

  const [snapshot] = await db
    .insert(jobDailySnapshots)
    .values({
      tenantId: ctx.tenantId,
      jobId,
      userId: ctx.userId,
      snapshotDate: today,
      completionPercent: input.completionPercent ?? null,
      laborHours: String(costing.actualLaborHours),
      laborCost: String(costing.actualLaborCost),
      materialCost: String(costing.actualMaterialCost),
      notes: input.notes || null,
    })
    .returning();

  return snapshot;
}
