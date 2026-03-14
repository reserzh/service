import { db } from "@/lib/db";
import { dailyReports, users } from "@fieldservice/shared/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
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
