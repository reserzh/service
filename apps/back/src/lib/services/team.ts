import { db } from "@/lib/db";
import { users } from "@fieldservice/shared/db/schema";
import { eq, and, desc, asc, ilike, or, sql } from "drizzle-orm";
import type { UserContext, UserRole } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { logActivity } from "./activity";
import { NotFoundError, AppError, ConflictError } from "@/lib/api/errors";

// ---------- Types ----------

export interface ListTeamParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole;
  includeInactive?: boolean;
}

export interface InviteUserInput {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  hourlyRate?: number;
  canBeDispatched?: boolean;
  color?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  phone?: string | null;
  hourlyRate?: number | null;
  canBeDispatched?: boolean;
  color?: string;
}

// ---------- List ----------

export async function listTeamMembers(ctx: UserContext, params: ListTeamParams = {}) {
  assertPermission(ctx, "users", "read");

  const {
    page = 1,
    pageSize = 50,
    search,
    role,
    includeInactive = false,
  } = params;
  const offset = (page - 1) * pageSize;

  const conditions: ReturnType<typeof eq>[] = [eq(users.tenantId, ctx.tenantId)];

  if (!includeInactive) {
    conditions.push(eq(users.isActive, true));
  }

  if (role) {
    conditions.push(eq(users.role, role));
  }

  if (search) {
    const term = `%${search}%`;
    conditions.push(
      or(
        ilike(users.firstName, term),
        ilike(users.lastName, term),
        ilike(users.email, term)
      )!
    );
  }

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        color: users.color,
        hourlyRate: users.hourlyRate,
        canBeDispatched: users.canBeDispatched,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(asc(users.firstName), asc(users.lastName))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(...conditions)),
  ]);

  return {
    data,
    meta: { page, pageSize, total: Number(countResult[0].count) },
  };
}

// ---------- Get ----------

export async function getTeamMember(ctx: UserContext, userId: string) {
  assertPermission(ctx, "users", "read");

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), eq(users.tenantId, ctx.tenantId)))
    .limit(1);

  if (!user) throw new NotFoundError("Team member");

  return user;
}

// ---------- Create / Invite ----------

export async function createTeamMember(ctx: UserContext, supabaseUserId: string, input: InviteUserInput) {
  assertPermission(ctx, "users", "create");

  // Check for duplicate email in tenant
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, input.email), eq(users.tenantId, ctx.tenantId)))
    .limit(1);

  if (existing) {
    throw new ConflictError("A user with this email already exists in your organization.");
  }

  // Generate a color for the user
  const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];
  const color = input.color || colors[Math.floor(Math.random() * colors.length)];

  const [user] = await db
    .insert(users)
    .values({
      id: supabaseUserId,
      tenantId: ctx.tenantId,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      phone: input.phone || null,
      hourlyRate: input.hourlyRate ? String(input.hourlyRate) : null,
      canBeDispatched: input.canBeDispatched ?? (input.role === "technician"),
      color,
    })
    .returning();

  await logActivity(ctx, "user", user.id, "invited", {
    email: input.email,
    role: input.role,
  });

  return user;
}

// ---------- Update ----------

export async function updateTeamMember(ctx: UserContext, userId: string, input: UpdateUserInput) {
  assertPermission(ctx, "users", "update");

  const user = await getTeamMember(ctx, userId);

  // Prevent changing own role
  if (userId === ctx.userId && input.role && input.role !== user.role) {
    throw new AppError("VALIDATION_ERROR", "You cannot change your own role.", 400);
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (input.firstName !== undefined) updateData.firstName = input.firstName;
  if (input.lastName !== undefined) updateData.lastName = input.lastName;
  if (input.role !== undefined) updateData.role = input.role;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.hourlyRate !== undefined) updateData.hourlyRate = input.hourlyRate ? String(input.hourlyRate) : null;
  if (input.canBeDispatched !== undefined) updateData.canBeDispatched = input.canBeDispatched;
  if (input.color !== undefined) updateData.color = input.color;

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(and(eq(users.id, userId), eq(users.tenantId, ctx.tenantId)))
    .returning();

  await logActivity(ctx, "user", userId, "updated", input as unknown as Record<string, unknown>);

  return updated;
}

// ---------- Deactivate / Reactivate ----------

export async function deactivateTeamMember(ctx: UserContext, userId: string) {
  assertPermission(ctx, "users", "update");

  if (userId === ctx.userId) {
    throw new AppError("VALIDATION_ERROR", "You cannot deactivate your own account.", 400);
  }

  const user = await getTeamMember(ctx, userId);

  if (!user.isActive) {
    throw new AppError("INVALID_STATE", "User is already deactivated.", 422);
  }

  // Prevent deactivating the last admin
  if (user.role === "admin") {
    const [adminCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          eq(users.tenantId, ctx.tenantId),
          eq(users.role, "admin"),
          eq(users.isActive, true)
        )
      );
    if (Number(adminCount.count) <= 1) {
      throw new AppError("VALIDATION_ERROR", "Cannot deactivate the last admin.", 400);
    }
  }

  const [updated] = await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(users.id, userId), eq(users.tenantId, ctx.tenantId)))
    .returning();

  await logActivity(ctx, "user", userId, "deactivated");

  return updated;
}

export async function reactivateTeamMember(ctx: UserContext, userId: string) {
  assertPermission(ctx, "users", "update");

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), eq(users.tenantId, ctx.tenantId)))
    .limit(1);

  if (!user) throw new NotFoundError("Team member");

  if (user.isActive) {
    throw new AppError("INVALID_STATE", "User is already active.", 422);
  }

  const [updated] = await db
    .update(users)
    .set({ isActive: true, updatedAt: new Date() })
    .where(and(eq(users.id, userId), eq(users.tenantId, ctx.tenantId)))
    .returning();

  await logActivity(ctx, "user", userId, "reactivated");

  return updated;
}
