import { db } from "@/lib/db";
import { timeEntries, users } from "@fieldservice/shared/db/schema";
import { eq, and, gte, lte, asc, desc, sql } from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import type { TimeEntryType } from "@fieldservice/api-types/enums";

// ---------- Types ----------

export interface RecordClockEventInput {
  type: TimeEntryType;
  latitude?: number;
  longitude?: number;
  jobId?: string;
  notes?: string;
}

export interface GetTimeEntriesParams {
  from: string;
  to: string;
  userId?: string;
}

// ---------- Record Clock Event ----------

export async function recordClockEvent(ctx: UserContext, input: RecordClockEventInput) {
  const [entry] = await db
    .insert(timeEntries)
    .values({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      type: input.type,
      timestamp: new Date(),
      latitude: input.latitude != null ? String(input.latitude) : null,
      longitude: input.longitude != null ? String(input.longitude) : null,
      jobId: input.jobId || null,
      notes: input.notes || null,
    })
    .returning();

  return entry;
}

// ---------- Get Entries ----------

export async function getTimeEntries(ctx: UserContext, params: GetTimeEntriesParams) {
  const isOwnEntries = !params.userId || params.userId === ctx.userId;

  // Technicians can only see their own entries
  if (!isOwnEntries) {
    assertPermission(ctx, "reports", "read");
  }

  const targetUserId = params.userId || ctx.userId;
  const fromDate = new Date(params.from);
  const toDate = new Date(params.to);

  const entries = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.tenantId, ctx.tenantId),
        eq(timeEntries.userId, targetUserId),
        gte(timeEntries.timestamp, fromDate),
        lte(timeEntries.timestamp, toDate)
      )
    )
    .orderBy(asc(timeEntries.timestamp));

  return entries;
}

// ---------- Daily Timesheet ----------

export async function getDailyTimesheet(ctx: UserContext, date: string, userId?: string) {
  const isOwnEntries = !userId || userId === ctx.userId;
  if (!isOwnEntries) {
    assertPermission(ctx, "reports", "read");
  }

  const targetUserId = userId || ctx.userId;
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const entries = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.tenantId, ctx.tenantId),
        eq(timeEntries.userId, targetUserId),
        gte(timeEntries.timestamp, startOfDay),
        lte(timeEntries.timestamp, endOfDay)
      )
    )
    .orderBy(asc(timeEntries.timestamp));

  // Calculate net hours
  let totalMs = 0;
  let breakMs = 0;
  let clockInTime: Date | null = null;
  let breakStartTime: Date | null = null;

  for (const entry of entries) {
    const ts = new Date(entry.timestamp);
    switch (entry.type) {
      case "clock_in":
        clockInTime = ts;
        break;
      case "clock_out":
        if (clockInTime) {
          totalMs += ts.getTime() - clockInTime.getTime();
          clockInTime = null;
        }
        break;
      case "break_start":
        breakStartTime = ts;
        break;
      case "break_end":
        if (breakStartTime) {
          breakMs += ts.getTime() - breakStartTime.getTime();
          breakStartTime = null;
        }
        break;
    }
  }

  const netHours = Math.max(0, (totalMs - breakMs) / (1000 * 60 * 60));

  return { entries, netHours, totalMs, breakMs };
}

// ---------- Weekly Report ----------

export async function getWeeklyReport(ctx: UserContext, weekStart: string) {
  assertPermission(ctx, "reports", "read");

  const from = new Date(weekStart);
  const to = new Date(weekStart);
  to.setDate(to.getDate() + 7);

  // Get all technicians
  const technicians = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      hourlyRate: users.hourlyRate,
    })
    .from(users)
    .where(
      and(
        eq(users.tenantId, ctx.tenantId),
        eq(users.isActive, true),
        eq(users.canBeDispatched, true)
      )
    )
    .orderBy(asc(users.firstName));

  // Get all entries for the week
  const allEntries = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.tenantId, ctx.tenantId),
        gte(timeEntries.timestamp, from),
        lte(timeEntries.timestamp, to)
      )
    )
    .orderBy(asc(timeEntries.timestamp));

  // Group entries by user and calculate hours
  const report = technicians.map((tech) => {
    const techEntries = allEntries.filter((e) => e.userId === tech.id);
    let totalMs = 0;
    let breakMs = 0;
    let clockInTime: Date | null = null;
    let breakStartTime: Date | null = null;

    for (const entry of techEntries) {
      const ts = new Date(entry.timestamp);
      switch (entry.type) {
        case "clock_in":
          clockInTime = ts;
          break;
        case "clock_out":
          if (clockInTime) {
            totalMs += ts.getTime() - clockInTime.getTime();
            clockInTime = null;
          }
          break;
        case "break_start":
          breakStartTime = ts;
          break;
        case "break_end":
          if (breakStartTime) {
            breakMs += ts.getTime() - breakStartTime.getTime();
            breakStartTime = null;
          }
          break;
      }
    }

    const netHours = Math.max(0, (totalMs - breakMs) / (1000 * 60 * 60));
    const hourlyRate = tech.hourlyRate ? Number(tech.hourlyRate) : 0;
    const laborCost = netHours * hourlyRate;

    return {
      userId: tech.id,
      firstName: tech.firstName,
      lastName: tech.lastName,
      hourlyRate,
      netHours: Math.round(netHours * 100) / 100,
      laborCost: Math.round(laborCost * 100) / 100,
      entryCount: techEntries.length,
    };
  });

  return report;
}
