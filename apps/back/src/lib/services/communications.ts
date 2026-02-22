import { db } from "@/lib/db";
import {
  communicationTemplates,
  communicationLog,
  customers,
  tenants,
} from "@fieldservice/shared/db/schema";
import {
  eq,
  and,
  or,
  ilike,
  desc,
  asc,
  sql,
} from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { logActivity } from "./activity";
import { escapeLike } from "@/lib/utils";
import { NotFoundError, AppError } from "@/lib/api/errors";
import { sendEmail } from "@/lib/email/resend";
import { renderTemplate } from "@/lib/email/templates";
import type { CommunicationTrigger } from "@fieldservice/api-types/enums";

// ---------- Types ----------

export interface ListTemplatesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  trigger?: string;
}

export interface CreateTemplateInput {
  name: string;
  trigger?: string;
  subject: string;
  body: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdateTemplateInput {
  name?: string;
  trigger?: string | null;
  subject?: string;
  body?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface ListLogParams {
  page?: number;
  pageSize?: number;
  entityType?: string;
  entityId?: string;
}

// ---------- Template CRUD ----------

export async function listTemplates(ctx: UserContext, params: ListTemplatesParams = {}) {
  assertPermission(ctx, "communications", "read");

  const {
    page = 1,
    pageSize: rawPageSize = 25,
    search,
    trigger,
  } = params;
  const pageSize = Math.min(Math.max(rawPageSize, 1), 100);
  const offset = (page - 1) * pageSize;

  const conditions: ReturnType<typeof eq>[] = [eq(communicationTemplates.tenantId, ctx.tenantId)];

  if (trigger) {
    conditions.push(eq(communicationTemplates.trigger, trigger));
  }

  if (search) {
    const term = `%${escapeLike(search)}%`;
    conditions.push(
      or(
        ilike(communicationTemplates.name, term),
        ilike(communicationTemplates.subject, term)
      )!
    );
  }

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(communicationTemplates)
      .where(and(...conditions))
      .orderBy(asc(communicationTemplates.name))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(communicationTemplates)
      .where(and(...conditions)),
  ]);

  return {
    data,
    meta: { page, pageSize, total: Number(countResult[0].count) },
  };
}

export async function getTemplate(ctx: UserContext, templateId: string) {
  assertPermission(ctx, "communications", "read");

  const [template] = await db
    .select()
    .from(communicationTemplates)
    .where(and(eq(communicationTemplates.id, templateId), eq(communicationTemplates.tenantId, ctx.tenantId)))
    .limit(1);

  if (!template) throw new NotFoundError("Communication template");
  return template;
}

export async function createTemplate(ctx: UserContext, input: CreateTemplateInput) {
  assertPermission(ctx, "communications", "create");

  const [template] = await db
    .insert(communicationTemplates)
    .values({
      tenantId: ctx.tenantId,
      name: input.name,
      trigger: input.trigger || null,
      subject: input.subject,
      body: input.body,
      isActive: input.isActive ?? true,
      isDefault: input.isDefault ?? false,
    })
    .returning();

  await logActivity(ctx, "communication_template", template.id, "created");
  return template;
}

export async function updateTemplate(ctx: UserContext, templateId: string, input: UpdateTemplateInput) {
  assertPermission(ctx, "communications", "update");

  await getTemplate(ctx, templateId);

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updateData.name = input.name;
  if (input.trigger !== undefined) updateData.trigger = input.trigger;
  if (input.subject !== undefined) updateData.subject = input.subject;
  if (input.body !== undefined) updateData.body = input.body;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;
  if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;

  const [updated] = await db
    .update(communicationTemplates)
    .set(updateData)
    .where(and(eq(communicationTemplates.id, templateId), eq(communicationTemplates.tenantId, ctx.tenantId)))
    .returning();

  await logActivity(ctx, "communication_template", templateId, "updated");
  return updated;
}

export async function deleteTemplate(ctx: UserContext, templateId: string) {
  assertPermission(ctx, "communications", "delete");

  await getTemplate(ctx, templateId);

  await db
    .delete(communicationTemplates)
    .where(and(eq(communicationTemplates.id, templateId), eq(communicationTemplates.tenantId, ctx.tenantId)));

  await logActivity(ctx, "communication_template", templateId, "deleted");
}

// ---------- Send Communication ----------

export async function sendCommunication(
  ctx: UserContext,
  params: {
    recipientEmail: string;
    recipientName: string;
    subject: string;
    body: string;
    templateId?: string;
    entityType?: string;
    entityId?: string;
    variables?: Record<string, string | number | undefined | null>;
  }
) {
  const renderedSubject = params.variables
    ? renderTemplate(params.subject, params.variables)
    : params.subject;

  const renderedBody = params.variables
    ? renderTemplate(params.body, params.variables)
    : params.body;

  // Create log entry first as pending
  const [logEntry] = await db
    .insert(communicationLog)
    .values({
      tenantId: ctx.tenantId,
      templateId: params.templateId || null,
      recipientEmail: params.recipientEmail,
      recipientName: params.recipientName,
      subject: renderedSubject,
      channel: "email",
      status: "pending",
      entityType: params.entityType || null,
      entityId: params.entityId || null,
      sentBy: ctx.userId,
    })
    .returning();

  try {
    const result = await sendEmail({
      to: params.recipientEmail,
      subject: renderedSubject,
      html: renderedBody,
    });

    // Update log with success
    await db
      .update(communicationLog)
      .set({
        status: "sent",
        resendMessageId: result.id,
        sentAt: new Date(),
      })
      .where(eq(communicationLog.id, logEntry.id));

    return { ...logEntry, status: "sent", resendMessageId: result.id };
  } catch (error) {
    // Update log with failure
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await db
      .update(communicationLog)
      .set({
        status: "failed",
        errorMessage,
      })
      .where(eq(communicationLog.id, logEntry.id));

    console.error("[Communications] Send failed:", errorMessage);
    return { ...logEntry, status: "failed", errorMessage };
  }
}

// ---------- Trigger-based sending ----------

export async function sendTriggeredCommunication(
  ctx: UserContext,
  trigger: CommunicationTrigger,
  params: {
    recipientEmail: string;
    recipientName: string;
    entityType: string;
    entityId: string;
    variables: Record<string, string | number | undefined | null>;
  }
) {
  // Find active template for this trigger
  const [template] = await db
    .select()
    .from(communicationTemplates)
    .where(
      and(
        eq(communicationTemplates.tenantId, ctx.tenantId),
        eq(communicationTemplates.trigger, trigger),
        eq(communicationTemplates.isActive, true)
      )
    )
    .orderBy(desc(communicationTemplates.isDefault))
    .limit(1);

  if (!template) return null; // No template configured for this trigger

  return sendCommunication(ctx, {
    recipientEmail: params.recipientEmail,
    recipientName: params.recipientName,
    subject: template.subject,
    body: template.body,
    templateId: template.id,
    entityType: params.entityType,
    entityId: params.entityId,
    variables: params.variables,
  });
}

// ---------- Communication Log ----------

export async function listCommunicationLog(ctx: UserContext, params: ListLogParams = {}) {
  assertPermission(ctx, "communications", "read");

  const {
    page = 1,
    pageSize: rawPageSize = 25,
    entityType,
    entityId,
  } = params;
  const pageSize = Math.min(Math.max(rawPageSize, 1), 100);
  const offset = (page - 1) * pageSize;

  const conditions: ReturnType<typeof eq>[] = [eq(communicationLog.tenantId, ctx.tenantId)];

  if (entityType) {
    conditions.push(eq(communicationLog.entityType, entityType));
  }

  if (entityId) {
    conditions.push(eq(communicationLog.entityId, entityId));
  }

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(communicationLog)
      .where(and(...conditions))
      .orderBy(desc(communicationLog.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(communicationLog)
      .where(and(...conditions)),
  ]);

  return {
    data,
    meta: { page, pageSize, total: Number(countResult[0].count) },
  };
}
