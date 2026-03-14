import { db } from "@/lib/db";
import {
  jobs,
  jobNotes,
  jobPhotos,
  jobChecklistItems,
  users,
  properties,
} from "@fieldservice/shared/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { NotFoundError } from "@/lib/api/errors";

export interface PropertyHistoryEntry {
  jobId: string;
  jobNumber: string;
  summary: string;
  status: string;
  jobType: string;
  scheduledStart: string | null;
  completedAt: string | null;
  assignedFirstName: string | null;
  assignedLastName: string | null;
  notes: { content: string; isInternal: boolean; createdAt: string }[];
  photoCount: number;
  checklistSummary: { total: number; completed: number };
}

export interface PropertyHistoryResponse {
  property: {
    id: string;
    addressLine1: string;
    city: string;
    state: string;
    accessNotes: string | null;
    gateCode: string | null;
    obstacles: string[] | null;
  };
  recentJobs: PropertyHistoryEntry[];
}

export async function getPropertyHistory(
  ctx: UserContext,
  propertyId: string,
  limit: number = 5
): Promise<PropertyHistoryResponse> {
  assertPermission(ctx, "jobs", "read");

  // Verify property belongs to tenant
  const [property] = await db
    .select({
      id: properties.id,
      addressLine1: properties.addressLine1,
      city: properties.city,
      state: properties.state,
      accessNotes: properties.accessNotes,
      propertyMetadata: properties.propertyMetadata,
    })
    .from(properties)
    .where(and(eq(properties.id, propertyId), eq(properties.tenantId, ctx.tenantId)))
    .limit(1);

  if (!property) throw new NotFoundError("Property");

  // Get recent completed/in_progress jobs for this property
  const recentJobs = await db
    .select({
      id: jobs.id,
      jobNumber: jobs.jobNumber,
      summary: jobs.summary,
      status: jobs.status,
      jobType: jobs.jobType,
      scheduledStart: jobs.scheduledStart,
      completedAt: jobs.completedAt,
      assignedFirstName: users.firstName,
      assignedLastName: users.lastName,
    })
    .from(jobs)
    .leftJoin(users, and(eq(jobs.assignedTo, users.id), eq(users.tenantId, ctx.tenantId)))
    .where(
      and(
        eq(jobs.tenantId, ctx.tenantId),
        eq(jobs.propertyId, propertyId),
        sql`${jobs.status} IN ('completed', 'in_progress', 'en_route')`
      )
    )
    .orderBy(desc(jobs.completedAt), desc(jobs.scheduledStart))
    .limit(limit);

  // Fetch notes, photo counts, and checklist stats for each job
  const entries: PropertyHistoryEntry[] = await Promise.all(
    recentJobs.map(async (job) => {
      const [notes, photoCountResult, checklistResult] = await Promise.all([
        db
          .select({
            content: jobNotes.content,
            isInternal: jobNotes.isInternal,
            createdAt: jobNotes.createdAt,
          })
          .from(jobNotes)
          .where(
            and(
              eq(jobNotes.jobId, job.id),
              eq(jobNotes.tenantId, ctx.tenantId),
              eq(jobNotes.isInternal, false)
            )
          )
          .orderBy(desc(jobNotes.createdAt))
          .limit(3),
        db
          .select({ count: sql<number>`count(*)` })
          .from(jobPhotos)
          .where(and(eq(jobPhotos.jobId, job.id), eq(jobPhotos.tenantId, ctx.tenantId))),
        db
          .select({
            total: sql<number>`count(*)`,
            completed: sql<number>`count(*) filter (where ${jobChecklistItems.completed} = true)`,
          })
          .from(jobChecklistItems)
          .where(and(eq(jobChecklistItems.jobId, job.id), eq(jobChecklistItems.tenantId, ctx.tenantId))),
      ]);

      return {
        jobId: job.id,
        jobNumber: job.jobNumber,
        summary: job.summary,
        status: job.status,
        jobType: job.jobType,
        scheduledStart: job.scheduledStart?.toISOString() ?? null,
        completedAt: job.completedAt?.toISOString() ?? null,
        assignedFirstName: job.assignedFirstName,
        assignedLastName: job.assignedLastName,
        notes: notes.map((n) => ({
          content: n.content,
          isInternal: n.isInternal,
          createdAt: n.createdAt.toISOString(),
        })),
        photoCount: Number(photoCountResult[0].count),
        checklistSummary: {
          total: Number(checklistResult[0].total),
          completed: Number(checklistResult[0].completed),
        },
      };
    })
  );

  const metadata = property.propertyMetadata as { gateCode?: string; obstacles?: string[] } | null;

  return {
    property: {
      id: property.id,
      addressLine1: property.addressLine1,
      city: property.city,
      state: property.state,
      accessNotes: property.accessNotes,
      gateCode: metadata?.gateCode ?? null,
      obstacles: metadata?.obstacles ?? null,
    },
    recentJobs: entries,
  };
}
