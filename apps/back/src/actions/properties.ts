"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { properties } from "@fieldservice/shared/db/schema";
import { eq, and } from "drizzle-orm";
import { getActionErrorMessage, NotFoundError } from "@/lib/api/errors";
import { logActivity } from "@/lib/services/activity";

const propertySchema = z.object({
  name: z.string().max(255).optional().or(z.literal("")),
  addressLine1: z.string().min(1, "Address is required").max(255),
  addressLine2: z.string().max(255).optional().or(z.literal("")),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(50),
  zip: z.string().min(1, "ZIP is required").max(20),
  accessNotes: z.string().optional().or(z.literal("")),
});

export type PropertyActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  propertyId?: string;
};

export async function createPropertyAction(
  customerId: string,
  _prevState: PropertyActionState,
  formData: FormData
): Promise<PropertyActionState> {
  try {
    const ctx = await requireAuth();
    assertPermission(ctx, "customers", "update");

    const raw = Object.fromEntries(formData);
    const parsed = propertySchema.safeParse(raw);

    if (!parsed.success) {
      return {
        error: "Please fix the errors below.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const input = parsed.data;

    const [property] = await db
      .insert(properties)
      .values({
        tenantId: ctx.tenantId,
        customerId,
        name: input.name || null,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 || null,
        city: input.city,
        state: input.state,
        zip: input.zip,
        accessNotes: input.accessNotes || null,
        isPrimary: false,
      })
      .returning();

    await logActivity(ctx, "customer", customerId, "property_added", { propertyId: property.id });

    revalidatePath(`/customers/${customerId}`);
    return { success: true, propertyId: property.id };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to add property.") };
  }
}

export async function updatePropertyAction(
  customerId: string,
  propertyId: string,
  _prevState: PropertyActionState,
  formData: FormData
): Promise<PropertyActionState> {
  try {
    const ctx = await requireAuth();
    assertPermission(ctx, "customers", "update");

    const raw = Object.fromEntries(formData);
    const parsed = propertySchema.safeParse(raw);

    if (!parsed.success) {
      return {
        error: "Please fix the errors below.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const input = parsed.data;

    const [existing] = await db
      .select({ id: properties.id })
      .from(properties)
      .where(
        and(
          eq(properties.id, propertyId),
          eq(properties.customerId, customerId),
          eq(properties.tenantId, ctx.tenantId)
        )
      )
      .limit(1);

    if (!existing) throw new NotFoundError("Property");

    await db
      .update(properties)
      .set({
        name: input.name || null,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 || null,
        city: input.city,
        state: input.state,
        zip: input.zip,
        accessNotes: input.accessNotes || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(properties.id, propertyId),
          eq(properties.tenantId, ctx.tenantId)
        )
      );

    revalidatePath(`/customers/${customerId}`);
    return { success: true, propertyId };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to update property.") };
  }
}

export async function deletePropertyAction(
  customerId: string,
  propertyId: string
): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    assertPermission(ctx, "customers", "update");

    const [existing] = await db
      .select({ id: properties.id, isPrimary: properties.isPrimary })
      .from(properties)
      .where(
        and(
          eq(properties.id, propertyId),
          eq(properties.customerId, customerId),
          eq(properties.tenantId, ctx.tenantId)
        )
      )
      .limit(1);

    if (!existing) throw new NotFoundError("Property");

    if (existing.isPrimary) {
      return { error: "Cannot delete the primary property. Set another property as primary first." };
    }

    await db
      .delete(properties)
      .where(
        and(
          eq(properties.id, propertyId),
          eq(properties.tenantId, ctx.tenantId)
        )
      );

    await logActivity(ctx, "customer", customerId, "property_deleted", { propertyId });

    revalidatePath(`/customers/${customerId}`);
    return {};
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to delete property.") };
  }
}
