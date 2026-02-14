import { db } from "@/lib/db";
import { serviceCatalog } from "@fieldservice/shared/db/schema";
import { eq, and, asc } from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { logActivity } from "./activity";
import { NotFoundError } from "@/lib/api/errors";

export async function listServices(ctx: UserContext) {
  assertPermission(ctx, "website", "read");

  return db
    .select()
    .from(serviceCatalog)
    .where(eq(serviceCatalog.tenantId, ctx.tenantId))
    .orderBy(asc(serviceCatalog.sortOrder));
}

export async function getService(ctx: UserContext, serviceId: string) {
  assertPermission(ctx, "website", "read");

  const [service] = await db
    .select()
    .from(serviceCatalog)
    .where(and(eq(serviceCatalog.id, serviceId), eq(serviceCatalog.tenantId, ctx.tenantId)))
    .limit(1);

  if (!service) throw new NotFoundError("Service");
  return service;
}

export interface CreateServiceInput {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  icon?: string;
  imageUrl?: string;
  priceDisplay?: string;
  isBookable?: boolean;
  estimatedDuration?: number;
  sortOrder?: number;
}

export async function createService(ctx: UserContext, input: CreateServiceInput) {
  assertPermission(ctx, "website", "create");

  const [service] = await db
    .insert(serviceCatalog)
    .values({
      tenantId: ctx.tenantId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      shortDescription: input.shortDescription,
      icon: input.icon,
      imageUrl: input.imageUrl,
      priceDisplay: input.priceDisplay,
      isBookable: input.isBookable ?? true,
      estimatedDuration: input.estimatedDuration,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();

  await logActivity(ctx, "website", service.id, "service_created", { name: input.name });
  return service;
}

export interface UpdateServiceInput {
  id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  shortDescription?: string | null;
  icon?: string | null;
  imageUrl?: string | null;
  priceDisplay?: string | null;
  isBookable?: boolean;
  estimatedDuration?: number | null;
  sortOrder?: number;
  isActive?: boolean;
}

export async function updateService(ctx: UserContext, input: UpdateServiceInput) {
  assertPermission(ctx, "website", "update");

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updateData.name = input.name;
  if (input.slug !== undefined) updateData.slug = input.slug;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.shortDescription !== undefined) updateData.shortDescription = input.shortDescription;
  if (input.icon !== undefined) updateData.icon = input.icon;
  if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;
  if (input.priceDisplay !== undefined) updateData.priceDisplay = input.priceDisplay;
  if (input.isBookable !== undefined) updateData.isBookable = input.isBookable;
  if (input.estimatedDuration !== undefined) updateData.estimatedDuration = input.estimatedDuration;
  if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  const [updated] = await db
    .update(serviceCatalog)
    .set(updateData)
    .where(and(eq(serviceCatalog.id, input.id), eq(serviceCatalog.tenantId, ctx.tenantId)))
    .returning();

  if (!updated) throw new NotFoundError("Service");

  await logActivity(ctx, "website", updated.id, "service_updated");
  return updated;
}

export async function deleteService(ctx: UserContext, serviceId: string) {
  assertPermission(ctx, "website", "delete");

  const [deleted] = await db
    .delete(serviceCatalog)
    .where(and(eq(serviceCatalog.id, serviceId), eq(serviceCatalog.tenantId, ctx.tenantId)))
    .returning();

  if (!deleted) throw new NotFoundError("Service");

  await logActivity(ctx, "website", deleted.id, "service_deleted", { name: deleted.name });
  return deleted;
}
