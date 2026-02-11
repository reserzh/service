import { db } from "@/lib/db";
import { tenants, type TenantSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { logActivity } from "./activity";
import { NotFoundError } from "@/lib/api/errors";

// ---------- Get company profile ----------

export async function getCompanyProfile(ctx: UserContext) {
  assertPermission(ctx, "settings", "read");

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, ctx.tenantId))
    .limit(1);

  if (!tenant) throw new NotFoundError("Company");

  return tenant;
}

// ---------- Update company profile ----------

export interface UpdateCompanyInput {
  name?: string;
  email?: string;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  timezone?: string;
  website?: string | null;
  licenseNumber?: string | null;
  logoUrl?: string | null;
}

export async function updateCompanyProfile(ctx: UserContext, input: UpdateCompanyInput) {
  assertPermission(ctx, "settings", "update");

  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.email !== undefined) updateData.email = input.email;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.addressLine1 !== undefined) updateData.addressLine1 = input.addressLine1;
  if (input.addressLine2 !== undefined) updateData.addressLine2 = input.addressLine2;
  if (input.city !== undefined) updateData.city = input.city;
  if (input.state !== undefined) updateData.state = input.state;
  if (input.zip !== undefined) updateData.zip = input.zip;
  if (input.timezone !== undefined) updateData.timezone = input.timezone;
  if (input.website !== undefined) updateData.website = input.website;
  if (input.licenseNumber !== undefined) updateData.licenseNumber = input.licenseNumber;
  if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl;

  const [updated] = await db
    .update(tenants)
    .set(updateData)
    .where(eq(tenants.id, ctx.tenantId))
    .returning();

  await logActivity(ctx, "settings", ctx.tenantId, "company_updated");

  return updated;
}

// ---------- Get tenant settings (JSONB) ----------

export async function getTenantSettings(ctx: UserContext): Promise<TenantSettings> {
  assertPermission(ctx, "settings", "read");

  const [tenant] = await db
    .select({ settings: tenants.settings })
    .from(tenants)
    .where(eq(tenants.id, ctx.tenantId))
    .limit(1);

  if (!tenant) throw new NotFoundError("Company");

  return (tenant.settings ?? {}) as TenantSettings;
}

// ---------- Update tenant settings ----------

export async function updateTenantSettings(ctx: UserContext, updates: Partial<TenantSettings>) {
  assertPermission(ctx, "settings", "update");

  // Get current settings and merge
  const current = await getTenantSettings(ctx);
  const merged = { ...current, ...updates };

  const [updated] = await db
    .update(tenants)
    .set({ settings: merged, updatedAt: new Date() })
    .where(eq(tenants.id, ctx.tenantId))
    .returning({ settings: tenants.settings });

  await logActivity(ctx, "settings", ctx.tenantId, "settings_updated", updates);

  return updated.settings as TenantSettings;
}
