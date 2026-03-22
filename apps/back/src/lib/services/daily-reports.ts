import { db } from "@/lib/db";
import { dailyReports, users } from "@fieldservice/shared/db/schema";
import { eq, and, desc, asc, isNotNull, or, sql } from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";

export interface CreateDailyReportInput {
  materialRequests?: string;
  equipmentIssues?: string;
  officeNotes?: string;
}

export interface DailyReportListItem {
  id: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  reportDate: string;
  materialRequests: string | null;
  equipmentIssues: string | null;
  officeNotes: string | null;
  createdAt: string;
}

export async function createDailyReport(
  ctx: UserContext,
  input: CreateDailyReportInput
) {
  assertPermission(ctx, "reports", "update");

  const today = new Date().toISOString().split("T")[0];

  // Atomic upsert using onConflictDoUpdate to prevent race conditions
  const [report] = await db
    .insert(dailyReports)
    .values({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      reportDate: today,
      materialRequests: input.materialRequests || null,
      equipmentIssues: input.equipmentIssues || null,
      officeNotes: input.officeNotes || null,
    })
    .onConflictDoUpdate({
      target: [dailyReports.tenantId, dailyReports.userId, dailyReports.reportDate],
      set: {
        materialRequests: input.materialRequests || null,
        equipmentIssues: input.equipmentIssues || null,
        officeNotes: input.officeNotes || null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return report;
}

export async function listDailyReports(
  ctx: UserContext,
  date?: string
): Promise<DailyReportListItem[]> {
  assertPermission(ctx, "reports", "read");

  const targetDate = date ?? new Date().toISOString().split("T")[0];

  const data = await db
    .select({
      id: dailyReports.id,
      userId: dailyReports.userId,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      reportDate: dailyReports.reportDate,
      materialRequests: dailyReports.materialRequests,
      equipmentIssues: dailyReports.equipmentIssues,
      officeNotes: dailyReports.officeNotes,
      createdAt: dailyReports.createdAt,
    })
    .from(dailyReports)
    .leftJoin(users, and(eq(dailyReports.userId, users.id), eq(users.tenantId, ctx.tenantId)))
    .where(
      and(
        eq(dailyReports.tenantId, ctx.tenantId),
        eq(dailyReports.reportDate, targetDate)
      )
    )
    .orderBy(asc(users.firstName));

  return data.map((d) => ({
    ...d,
    userFirstName: d.userFirstName!,
    userLastName: d.userLastName!,
    createdAt: d.createdAt.toISOString(),
  }));
}

/**
 * Get pending material requests and equipment issues for today (or yesterday
 * if today has no reports yet). Used by the admin dashboard morning briefing widget.
 */
export async function getPendingCrewRequests(
  ctx: UserContext
): Promise<{
  date: string;
  requests: {
    userId: string;
    firstName: string;
    lastName: string;
    materialRequests: string | null;
    equipmentIssues: string | null;
    officeNotes: string | null;
  }[];
}> {
  assertPermission(ctx, "reports", "read");

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Try today first, fall back to yesterday
  for (const date of [today, yesterday]) {
    const data = await db
      .select({
        userId: dailyReports.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        materialRequests: dailyReports.materialRequests,
        equipmentIssues: dailyReports.equipmentIssues,
        officeNotes: dailyReports.officeNotes,
      })
      .from(dailyReports)
      .leftJoin(users, and(eq(dailyReports.userId, users.id), eq(users.tenantId, ctx.tenantId)))
      .where(
        and(
          eq(dailyReports.tenantId, ctx.tenantId),
          eq(dailyReports.reportDate, date),
          or(
            isNotNull(dailyReports.materialRequests),
            isNotNull(dailyReports.equipmentIssues),
            isNotNull(dailyReports.officeNotes)
          )
        )
      )
      .orderBy(asc(users.firstName));

    if (data.length > 0) {
      return {
        date,
        requests: data.map((d) => ({
          userId: d.userId,
          firstName: d.firstName!,
          lastName: d.lastName!,
          materialRequests: d.materialRequests,
          equipmentIssues: d.equipmentIssues,
          officeNotes: d.officeNotes,
        })),
      };
    }
  }

  return { date: today, requests: [] };
}
