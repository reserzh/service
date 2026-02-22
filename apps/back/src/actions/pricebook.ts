"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  createPricebookItem,
  updatePricebookItem,
  deletePricebookItem,
} from "@/lib/services/pricebook";
import { getActionErrorMessage } from "@/lib/api/errors";

const pricebookItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(2000).optional().or(z.literal("")),
  sku: z.string().max(100).optional().or(z.literal("")),
  category: z.string().max(100).optional().or(z.literal("")),
  type: z.enum(["service", "material", "labor", "discount", "other"]).optional(),
  unitPrice: z.string().min(1, "Price is required"),
  unit: z.string().max(50).optional().or(z.literal("")),
  costPrice: z.string().optional().or(z.literal("")),
  taxable: z.string().optional(),
});

export type PricebookActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  itemId?: string;
};

export async function createPricebookItemAction(
  _prevState: PricebookActionState,
  formData: FormData
): Promise<PricebookActionState> {
  try {
    const ctx = await requireAuth();
    const raw = Object.fromEntries(formData);
    const parsed = pricebookItemSchema.safeParse(raw);

    if (!parsed.success) {
      return {
        error: "Please fix the errors below",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const unitPrice = parseFloat(parsed.data.unitPrice);
    if (isNaN(unitPrice) || unitPrice < 0) {
      return { error: "Invalid unit price" };
    }

    const costPrice = parsed.data.costPrice ? parseFloat(parsed.data.costPrice) : undefined;
    if (costPrice !== undefined && isNaN(costPrice)) {
      return { error: "Invalid cost price" };
    }

    const item = await createPricebookItem(ctx, {
      name: parsed.data.name,
      description: parsed.data.description || undefined,
      sku: parsed.data.sku || undefined,
      category: parsed.data.category || undefined,
      type: parsed.data.type,
      unitPrice,
      unit: parsed.data.unit || undefined,
      costPrice,
      taxable: parsed.data.taxable !== "false",
    });

    revalidatePath("/settings/pricebook");
    return { success: true, itemId: item.id };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to create pricebook item") };
  }
}

export async function updatePricebookItemAction(
  _prevState: PricebookActionState,
  formData: FormData
): Promise<PricebookActionState> {
  try {
    const ctx = await requireAuth();
    const itemId = formData.get("id") as string;
    const raw = Object.fromEntries(formData);
    const parsed = pricebookItemSchema.safeParse(raw);

    if (!parsed.success) {
      return {
        error: "Please fix the errors below",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const unitPrice = parseFloat(parsed.data.unitPrice);
    if (isNaN(unitPrice) || unitPrice < 0) {
      return { error: "Invalid unit price" };
    }

    const costPrice = parsed.data.costPrice ? parseFloat(parsed.data.costPrice) : undefined;
    if (costPrice !== undefined && isNaN(costPrice)) {
      return { error: "Invalid cost price" };
    }

    await updatePricebookItem(ctx, itemId, {
      name: parsed.data.name,
      description: parsed.data.description || null,
      sku: parsed.data.sku || null,
      category: parsed.data.category || null,
      type: parsed.data.type,
      unitPrice,
      unit: parsed.data.unit || null,
      costPrice: costPrice ?? null,
      taxable: parsed.data.taxable !== "false",
    });

    revalidatePath("/settings/pricebook");
    return { success: true, itemId };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to update pricebook item") };
  }
}

export async function deletePricebookItemAction(
  itemId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const ctx = await requireAuth();
    await deletePricebookItem(ctx, itemId);
    revalidatePath("/settings/pricebook");
    return { success: true };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to delete pricebook item") };
  }
}
