import { db } from "@/lib/db";
import {
  companyEquipment,
  equipmentMaintenanceLog,
  users,
} from "@fieldservice/shared/db/schema";
import { eq, and, desc, asc, ilike, sql } from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { NotFoundError } from "@/lib/api/errors";
import { escapeLike } from "@/lib/utils";

export interface CreateCompanyEquipmentInput {
  name: string;
  type: string;
  serialNumber?: string;
  brand?: string;
  model?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  assignedTo?: string;
  notes?: string;
}

export interface UpdateCompanyEquipmentInput {
  name?: string;
  type?: string;
  serialNumber?: string | null;
  brand?: string | null;
  model?: string | null;
  purchaseDate?: string | null;
  purchaseCost?: number | null;
  lastServiceDate?: string | null;
  nextServiceDue?: string | null;
  hoursUsed?: number;
  status?: string;
  assignedTo?: string | null;
  notes?: string | null;
}

export async function listCompanyEquipment(
  ctx: UserContext,
  params: { search?: string; status?: string } = {}
) {
  assertPermission(ctx, "settings", "read");

  const conditions: ReturnType<typeof eq>[] = [eq(companyEquipment.tenantId, ctx.tenantId)];

  if (params.status) {
    conditions.push(eq(companyEquipment.status, params.status));
  }

  if (params.search) {
    const term = `%${escapeLike(params.search)}%`;
    conditions.push(ilike(companyEquipment.name, term));
  }

  return db
    .select({
      id: companyEquipment.id,
      name: companyEquipment.name,
      type: companyEquipment.type,
      serialNumber: companyEquipment.serialNumber,
      brand: companyEquipment.brand,
      model: companyEquipment.model,
      lastServiceDate: companyEquipment.lastServiceDate,
      nextServiceDue: companyEquipment.nextServiceDue,
      hoursUsed: companyEquipment.hoursUsed,
      status: companyEquipment.status,
      assignedTo: companyEquipment.assignedTo,
      assignedFirstName: users.firstName,
      assignedLastName: users.lastName,
      notes: companyEquipment.notes,
      createdAt: companyEquipment.createdAt,
    })
    .from(companyEquipment)
    .leftJoin(users, and(eq(companyEquipment.assignedTo, users.id), eq(users.tenantId, ctx.tenantId)))
    .where(and(...conditions))
    .orderBy(asc(companyEquipment.name));
}

export async function getCompanyEquipmentItem(ctx: UserContext, id: string) {
  assertPermission(ctx, "settings", "read");

  const [item] = await db
    .select()
    .from(companyEquipment)
    .where(and(eq(companyEquipment.id, id), eq(companyEquipment.tenantId, ctx.tenantId)))
    .limit(1);

  if (!item) throw new NotFoundError("Equipment");
  return item;
}

export async function createCompanyEquipmentItem(ctx: UserContext, input: CreateCompanyEquipmentInput) {
  assertPermission(ctx, "settings", "update");

  const [item] = await db
    .insert(companyEquipment)
    .values({
      tenantId: ctx.tenantId,
      name: input.name,
      type: input.type,
      serialNumber: input.serialNumber || null,
      brand: input.brand || null,
      model: input.model || null,
      purchaseDate: input.purchaseDate || null,
      purchaseCost: input.purchaseCost ? String(input.purchaseCost) : null,
      assignedTo: input.assignedTo || null,
      notes: input.notes || null,
    })
    .returning();

  return item;
}

export async function updateCompanyEquipmentItem(
  ctx: UserContext,
  id: string,
  input: UpdateCompanyEquipmentInput
) {
  assertPermission(ctx, "settings", "update");
  await getCompanyEquipmentItem(ctx, id);

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updateData.name = input.name;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.serialNumber !== undefined) updateData.serialNumber = input.serialNumber;
  if (input.brand !== undefined) updateData.brand = input.brand;
  if (input.model !== undefined) updateData.model = input.model;
  if (input.purchaseDate !== undefined) updateData.purchaseDate = input.purchaseDate;
  if (input.purchaseCost !== undefined) updateData.purchaseCost = input.purchaseCost !== null ? String(input.purchaseCost) : null;
  if (input.lastServiceDate !== undefined) updateData.lastServiceDate = input.lastServiceDate;
  if (input.nextServiceDue !== undefined) updateData.nextServiceDue = input.nextServiceDue;
  if (input.hoursUsed !== undefined) updateData.hoursUsed = input.hoursUsed;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.assignedTo !== undefined) updateData.assignedTo = input.assignedTo;
  if (input.notes !== undefined) updateData.notes = input.notes;

  const [updated] = await db
    .update(companyEquipment)
    .set(updateData)
    .where(and(eq(companyEquipment.id, id), eq(companyEquipment.tenantId, ctx.tenantId)))
    .returning();

  return updated;
}

export async function deleteCompanyEquipmentItem(ctx: UserContext, id: string) {
  assertPermission(ctx, "settings", "update");
  await getCompanyEquipmentItem(ctx, id);

  await db
    .delete(companyEquipment)
    .where(and(eq(companyEquipment.id, id), eq(companyEquipment.tenantId, ctx.tenantId)));
}

export async function addMaintenanceLog(
  ctx: UserContext,
  equipmentId: string,
  input: { type: string; description?: string; cost?: number; performedAt: string; hoursAtService?: number }
) {
  assertPermission(ctx, "settings", "update");
  const item = await getCompanyEquipmentItem(ctx, equipmentId);

  const [log] = await db
    .insert(equipmentMaintenanceLog)
    .values({
      tenantId: ctx.tenantId,
      equipmentId,
      type: input.type,
      description: input.description || null,
      cost: input.cost ? String(input.cost) : null,
      performedBy: ctx.userId,
      performedAt: input.performedAt,
      hoursAtService: input.hoursAtService ?? null,
    })
    .returning();

  // Update equipment's last service date
  await db
    .update(companyEquipment)
    .set({ lastServiceDate: input.performedAt, updatedAt: new Date() })
    .where(eq(companyEquipment.id, equipmentId));

  return log;
}

export async function getMaintenanceLogs(ctx: UserContext, equipmentId: string) {
  assertPermission(ctx, "settings", "read");
  await getCompanyEquipmentItem(ctx, equipmentId);

  return db
    .select({
      id: equipmentMaintenanceLog.id,
      type: equipmentMaintenanceLog.type,
      description: equipmentMaintenanceLog.description,
      cost: equipmentMaintenanceLog.cost,
      performedAt: equipmentMaintenanceLog.performedAt,
      hoursAtService: equipmentMaintenanceLog.hoursAtService,
      performedByFirstName: users.firstName,
      performedByLastName: users.lastName,
      createdAt: equipmentMaintenanceLog.createdAt,
    })
    .from(equipmentMaintenanceLog)
    .leftJoin(users, and(eq(equipmentMaintenanceLog.performedBy, users.id), eq(users.tenantId, ctx.tenantId)))
    .where(and(eq(equipmentMaintenanceLog.equipmentId, equipmentId), eq(equipmentMaintenanceLog.tenantId, ctx.tenantId)))
    .orderBy(desc(equipmentMaintenanceLog.performedAt));
}
