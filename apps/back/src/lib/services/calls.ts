import { db } from "@/lib/db";
import {
  calls,
  callRecordings,
  customers,
  jobs,
  users,
  tenants,
} from "@fieldservice/shared/db/schema";
import {
  eq,
  and,
  or,
  ilike,
  desc,
  sql,
  gte,
  lte,
} from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { escapeLike } from "@/lib/utils";
import { NotFoundError } from "@/lib/api/errors";
import {
  initiateOutboundCall,
  isVoiceConfigured,
} from "@/lib/voice/twilio-voice";
import type { CallDirection, CallStatus } from "@fieldservice/api-types/enums";
import type { TenantSettings } from "@fieldservice/shared/db/schema/tenants";

// ---------- Types ----------

export interface ListCallsParams {
  page?: number;
  pageSize?: number;
  direction?: CallDirection;
  status?: CallStatus;
  customerId?: string;
  userId?: string;
  jobId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface CreateCallRecordInput {
  callSid: string;
  direction: CallDirection;
  fromNumber: string;
  toNumber: string;
  status?: CallStatus;
  customerId?: string;
  jobId?: string;
  userId?: string;
  startedAt?: Date;
}

export interface UpdateCallInput {
  notes?: string;
  customerId?: string | null;
  jobId?: string | null;
  status?: CallStatus;
  duration?: number;
  endedAt?: Date;
  startedAt?: Date;
}

export interface CreateRecordingInput {
  callId: string;
  recordingSid: string;
  duration?: number;
  recordingUrl?: string;
  status?: "processing" | "completed" | "failed" | "deleted";
}

// ---------- List ----------

export async function listCalls(ctx: UserContext, params: ListCallsParams = {}) {
  assertPermission(ctx, "calls", "read");

  const {
    page = 1,
    pageSize: rawPageSize = 25,
    direction,
    status,
    customerId,
    userId,
    jobId,
    dateFrom,
    dateTo,
    search,
  } = params;
  const pageSize = Math.min(Math.max(rawPageSize, 1), 100);
  const offset = (page - 1) * pageSize;

  const conditions: ReturnType<typeof eq>[] = [eq(calls.tenantId, ctx.tenantId)];

  if (direction) conditions.push(eq(calls.direction, direction));
  if (status) conditions.push(eq(calls.status, status));
  if (customerId) conditions.push(eq(calls.customerId, customerId));
  if (userId) conditions.push(eq(calls.userId, userId));
  if (jobId) conditions.push(eq(calls.jobId, jobId));
  if (dateFrom) conditions.push(gte(calls.createdAt, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(calls.createdAt, new Date(dateTo)));

  if (search) {
    const term = `%${escapeLike(search)}%`;
    conditions.push(
      or(
        ilike(calls.fromNumber, term),
        ilike(calls.toNumber, term)
      )!
    );
  }

  const [data, countResult] = await Promise.all([
    db
      .select({
        call: calls,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
        customerPhone: customers.phone,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        jobNumber: jobs.jobNumber,
        jobSummary: jobs.summary,
      })
      .from(calls)
      .leftJoin(customers, and(eq(calls.customerId, customers.id), eq(customers.tenantId, ctx.tenantId)))
      .leftJoin(users, and(eq(calls.userId, users.id), eq(users.tenantId, ctx.tenantId)))
      .leftJoin(jobs, and(eq(calls.jobId, jobs.id), eq(jobs.tenantId, ctx.tenantId)))
      .where(and(...conditions))
      .orderBy(desc(calls.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(calls)
      .where(and(...conditions)),
  ]);

  const rows = data.map((row) => ({
    ...row.call,
    customer: row.customerFirstName
      ? {
          id: row.call.customerId!,
          firstName: row.customerFirstName,
          lastName: row.customerLastName!,
          phone: row.customerPhone!,
        }
      : null,
    user: row.userFirstName
      ? {
          id: row.call.userId!,
          firstName: row.userFirstName,
          lastName: row.userLastName!,
        }
      : null,
    job: row.jobNumber
      ? {
          id: row.call.jobId!,
          jobNumber: row.jobNumber,
          summary: row.jobSummary!,
        }
      : null,
  }));

  return {
    data: rows,
    meta: { page, pageSize, total: Number(countResult[0].count) },
  };
}

// ---------- Get Detail ----------

export async function getCall(ctx: UserContext, callId: string) {
  assertPermission(ctx, "calls", "read");

  const [row] = await db
    .select({
      call: calls,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      customerPhone: customers.phone,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      jobNumber: jobs.jobNumber,
      jobSummary: jobs.summary,
    })
    .from(calls)
    .leftJoin(customers, and(eq(calls.customerId, customers.id), eq(customers.tenantId, ctx.tenantId)))
    .leftJoin(users, and(eq(calls.userId, users.id), eq(users.tenantId, ctx.tenantId)))
    .leftJoin(jobs, and(eq(calls.jobId, jobs.id), eq(jobs.tenantId, ctx.tenantId)))
    .where(and(eq(calls.id, callId), eq(calls.tenantId, ctx.tenantId)))
    .limit(1);

  if (!row) throw new NotFoundError("Call");

  const recordings = await db
    .select()
    .from(callRecordings)
    .where(and(eq(callRecordings.callId, callId), eq(callRecordings.tenantId, ctx.tenantId)));

  return {
    ...row.call,
    customer: row.customerFirstName
      ? {
          id: row.call.customerId!,
          firstName: row.customerFirstName,
          lastName: row.customerLastName!,
          phone: row.customerPhone!,
        }
      : null,
    user: row.userFirstName
      ? {
          id: row.call.userId!,
          firstName: row.userFirstName,
          lastName: row.userLastName!,
        }
      : null,
    job: row.jobNumber
      ? {
          id: row.call.jobId!,
          jobNumber: row.jobNumber,
          summary: row.jobSummary!,
        }
      : null,
    recordings,
  };
}

// ---------- Create Call Record ----------

// Auto-match customer by phone number within tenant
async function autoMatchCustomer(tenantId: string, phoneNumber: string): Promise<string | null> {
  const [match] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(
        eq(customers.tenantId, tenantId),
        or(
          eq(customers.phone, phoneNumber),
          eq(customers.altPhone, phoneNumber)
        )
      )
    )
    .limit(1);
  return match?.id ?? null;
}

// For authenticated users (permission-checked)
export async function createCallRecord(ctx: UserContext, input: CreateCallRecordInput) {
  assertPermission(ctx, "calls", "create");

  let customerId = input.customerId;
  if (!customerId) {
    const phoneToMatch = input.direction === "inbound" ? input.fromNumber : input.toNumber;
    customerId = await autoMatchCustomer(ctx.tenantId, phoneToMatch) ?? undefined;
  }

  const [call] = await db
    .insert(calls)
    .values({
      tenantId: ctx.tenantId,
      callSid: input.callSid,
      direction: input.direction,
      fromNumber: input.fromNumber,
      toNumber: input.toNumber,
      status: input.status ?? "initiated",
      customerId: customerId ?? null,
      jobId: input.jobId ?? null,
      userId: input.userId ?? ctx.userId,
      startedAt: input.startedAt ?? new Date(),
    })
    .returning();

  return call;
}

// For webhooks (no auth context, tenant already verified by phone number lookup)
export async function createCallRecordFromWebhook(tenantId: string, input: CreateCallRecordInput) {
  let customerId = input.customerId;
  if (!customerId) {
    const phoneToMatch = input.direction === "inbound" ? input.fromNumber : input.toNumber;
    customerId = await autoMatchCustomer(tenantId, phoneToMatch) ?? undefined;
  }

  const [call] = await db
    .insert(calls)
    .values({
      tenantId,
      callSid: input.callSid,
      direction: input.direction,
      fromNumber: input.fromNumber,
      toNumber: input.toNumber,
      status: input.status ?? "initiated",
      customerId: customerId ?? null,
      jobId: input.jobId ?? null,
      userId: input.userId ?? null,
      startedAt: input.startedAt ?? new Date(),
    })
    .returning();

  return call;
}

// ---------- Update ----------

export async function updateCall(ctx: UserContext, callId: string, input: UpdateCallInput) {
  assertPermission(ctx, "calls", "update");

  const [existing] = await db
    .select({ id: calls.id })
    .from(calls)
    .where(and(eq(calls.id, callId), eq(calls.tenantId, ctx.tenantId)))
    .limit(1);

  if (!existing) throw new NotFoundError("Call");

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.customerId !== undefined) updateData.customerId = input.customerId;
  if (input.jobId !== undefined) updateData.jobId = input.jobId;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.duration !== undefined) updateData.duration = input.duration;
  if (input.endedAt !== undefined) updateData.endedAt = input.endedAt;
  if (input.startedAt !== undefined) updateData.startedAt = input.startedAt;

  const [updated] = await db
    .update(calls)
    .set(updateData)
    .where(and(eq(calls.id, callId), eq(calls.tenantId, ctx.tenantId)))
    .returning();

  return updated;
}

// ---------- Update by CallSid (for webhooks) ----------

export async function updateCallBySid(callSid: string, input: UpdateCallInput & { status?: CallStatus }) {
  // First lookup the call to get its tenantId for scoped update
  const [existing] = await db
    .select({ id: calls.id, tenantId: calls.tenantId })
    .from(calls)
    .where(eq(calls.callSid, callSid))
    .limit(1);

  if (!existing) return null;

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.status !== undefined) updateData.status = input.status;
  if (input.duration !== undefined) updateData.duration = input.duration;
  if (input.endedAt !== undefined) updateData.endedAt = input.endedAt;
  if (input.startedAt !== undefined) updateData.startedAt = input.startedAt;

  const [updated] = await db
    .update(calls)
    .set(updateData)
    .where(and(eq(calls.callSid, callSid), eq(calls.tenantId, existing.tenantId)))
    .returning();

  return updated ?? null;
}

// ---------- Recordings ----------

export async function createRecording(tenantId: string, input: CreateRecordingInput) {
  const [recording] = await db
    .insert(callRecordings)
    .values({
      tenantId,
      callId: input.callId,
      recordingSid: input.recordingSid,
      duration: input.duration ?? null,
      recordingUrl: input.recordingUrl ?? null,
      status: input.status ?? "processing",
    })
    .returning();

  return recording;
}

export async function updateRecording(
  recordingSid: string,
  input: {
    status?: "processing" | "completed" | "failed" | "deleted";
    duration?: number;
    recordingUrl?: string;
    transcriptionText?: string;
    transcriptionStatus?: "none" | "processing" | "completed" | "failed";
  }
) {
  // Lookup recording first for tenant-scoped update
  const [existing] = await db
    .select({ id: callRecordings.id, tenantId: callRecordings.tenantId })
    .from(callRecordings)
    .where(eq(callRecordings.recordingSid, recordingSid))
    .limit(1);

  if (!existing) return null;

  const updateData: Record<string, unknown> = {};
  if (input.status !== undefined) updateData.status = input.status;
  if (input.duration !== undefined) updateData.duration = input.duration;
  if (input.recordingUrl !== undefined) updateData.recordingUrl = input.recordingUrl;
  if (input.transcriptionText !== undefined) updateData.transcriptionText = input.transcriptionText;
  if (input.transcriptionStatus !== undefined) updateData.transcriptionStatus = input.transcriptionStatus;

  const [updated] = await db
    .update(callRecordings)
    .set(updateData)
    .where(and(eq(callRecordings.recordingSid, recordingSid), eq(callRecordings.tenantId, existing.tenantId)))
    .returning();

  return updated ?? null;
}

export async function getCallRecordings(ctx: UserContext, callId: string) {
  assertPermission(ctx, "calls", "read");

  return db
    .select()
    .from(callRecordings)
    .where(and(eq(callRecordings.callId, callId), eq(callRecordings.tenantId, ctx.tenantId)));
}

// ---------- Analytics ----------

export async function getCallAnalytics(ctx: UserContext, dateFrom?: string, dateTo?: string) {
  assertPermission(ctx, "calls", "read");

  const conditions: ReturnType<typeof eq>[] = [eq(calls.tenantId, ctx.tenantId)];
  if (dateFrom) conditions.push(gte(calls.createdAt, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(calls.createdAt, new Date(dateTo)));

  const where = and(...conditions);

  const [totals, byDirection, byStatus] = await Promise.all([
    db
      .select({
        totalCalls: sql<number>`count(*)`,
        avgDuration: sql<number>`coalesce(avg(${calls.duration}), 0)`,
        totalDuration: sql<number>`coalesce(sum(${calls.duration}), 0)`,
      })
      .from(calls)
      .where(where),
    db
      .select({
        direction: calls.direction,
        count: sql<number>`count(*)`,
      })
      .from(calls)
      .where(where)
      .groupBy(calls.direction),
    db
      .select({
        status: calls.status,
        count: sql<number>`count(*)`,
      })
      .from(calls)
      .where(where)
      .groupBy(calls.status),
  ]);

  return {
    totalCalls: Number(totals[0].totalCalls),
    avgDuration: Math.round(Number(totals[0].avgDuration)),
    totalDuration: Number(totals[0].totalDuration),
    byDirection: byDirection.map((r) => ({ direction: r.direction, count: Number(r.count) })),
    byStatus: byStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
  };
}

// ---------- Initiate Outbound Call ----------

export async function initiateCall(
  ctx: UserContext,
  params: { toNumber: string; jobId?: string }
) {
  assertPermission(ctx, "calls", "create");

  // Get tenant voice settings
  const [tenant] = await db
    .select({ settings: tenants.settings })
    .from(tenants)
    .where(eq(tenants.id, ctx.tenantId))
    .limit(1);

  const settings = (tenant?.settings ?? {}) as TenantSettings;
  const fromNumber = settings.voice?.twilioPhoneNumber;
  if (!fromNumber) {
    throw new Error("Voice phone number not configured. Go to Settings > Voice to configure.");
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const statusCallback = `${baseUrl}/api/v1/webhooks/twilio/voice/status`;
  const recordingCallback = `${baseUrl}/api/v1/webhooks/twilio/voice/recording`;

  const { sid } = await initiateOutboundCall({
    to: params.toNumber,
    from: fromNumber,
    statusCallback,
    record: settings.voice?.autoRecord ?? false,
    recordingStatusCallback: recordingCallback,
  });

  const call = await createCallRecord(ctx, {
    callSid: sid,
    direction: "outbound",
    fromNumber,
    toNumber: params.toNumber,
    status: "initiated",
    jobId: params.jobId,
    userId: ctx.userId,
  });

  return call;
}

// ---------- Tenant lookup by phone ----------

export async function findTenantByVoiceNumber(phoneNumber: string) {
  const [row] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(sql`${tenants.settings}->'voice'->>'twilioPhoneNumber' = ${phoneNumber}`)
    .limit(1);

  return row?.id ?? null;
}
