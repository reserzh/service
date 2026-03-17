"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  createCompanyEquipmentItem,
  updateCompanyEquipmentItem,
  deleteCompanyEquipmentItem,
  addMaintenanceLog,
} from "@/lib/services/company-equipment";
import { getActionErrorMessage } from "@/lib/api/errors";

const equipmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  type: z.string().min(1, "Type is required").max(100),
  serialNumber: z.string().max(100).optional().or(z.literal("")),
  brand: z.string().max(100).optional().or(z.literal("")),
  model: z.string().max(100).optional().or(z.literal("")),
  purchaseDate: z.string().optional().or(z.literal("")),
  purchaseCost: z.string().optional().or(z.literal("")),
  assignedTo: z.string().optional().or(z.literal("")).or(z.literal("none")),
  notes: z.string().optional().or(z.literal("")),
  serviceIntervalDays: z.string().optional().or(z.literal("")),
  serviceIntervalHours: z.string().optional().or(z.literal("")),
  status: z.string().optional(),
});

const maintenanceSchema = z.object({
  equipmentId: z.string().uuid(),
  type: z.string().min(1, "Type is required").max(100),
  description: z.string().optional().or(z.literal("")),
  cost: z.string().optional().or(z.literal("")),
  performedAt: z.string().min(1, "Date is required"),
  hoursAtService: z.string().optional().or(z.literal("")),
});

export type EquipmentActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  itemId?: string;
};

export async function createEquipmentAction(
  _prevState: EquipmentActionState,
  formData: FormData
): Promise<EquipmentActionState> {
  try {
    const ctx = await requireAuth();
    const raw = Object.fromEntries(formData);
    const parsed = equipmentSchema.safeParse(raw);

    if (!parsed.success) {
      return {
        error: "Please fix the errors below",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const purchaseCost = parsed.data.purchaseCost
      ? parseFloat(parsed.data.purchaseCost)
      : undefined;
    if (purchaseCost !== undefined && isNaN(purchaseCost)) {
      return { error: "Invalid purchase cost" };
    }

    const serviceIntervalDays = parsed.data.serviceIntervalDays
      ? parseInt(parsed.data.serviceIntervalDays)
      : undefined;
    const serviceIntervalHours = parsed.data.serviceIntervalHours
      ? parseInt(parsed.data.serviceIntervalHours)
      : undefined;

    const item = await createCompanyEquipmentItem(ctx, {
      name: parsed.data.name,
      type: parsed.data.type,
      serialNumber: parsed.data.serialNumber || undefined,
      brand: parsed.data.brand || undefined,
      model: parsed.data.model || undefined,
      purchaseDate: parsed.data.purchaseDate || undefined,
      purchaseCost,
      assignedTo: parsed.data.assignedTo && parsed.data.assignedTo !== "none" ? parsed.data.assignedTo : undefined,
      notes: parsed.data.notes || undefined,
      serviceIntervalDays,
      serviceIntervalHours,
    });

    revalidatePath("/settings/equipment");
    return { success: true, itemId: item.id };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to create equipment") };
  }
}

export async function updateEquipmentAction(
  _prevState: EquipmentActionState,
  formData: FormData
): Promise<EquipmentActionState> {
  try {
    const ctx = await requireAuth();
    const itemId = formData.get("id") as string;
    const raw = Object.fromEntries(formData);
    const parsed = equipmentSchema.safeParse(raw);

    if (!parsed.success) {
      return {
        error: "Please fix the errors below",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const purchaseCost = parsed.data.purchaseCost
      ? parseFloat(parsed.data.purchaseCost)
      : null;
    if (purchaseCost !== null && isNaN(purchaseCost)) {
      return { error: "Invalid purchase cost" };
    }

    const serviceIntervalDays = parsed.data.serviceIntervalDays
      ? parseInt(parsed.data.serviceIntervalDays)
      : null;
    const serviceIntervalHours = parsed.data.serviceIntervalHours
      ? parseInt(parsed.data.serviceIntervalHours)
      : null;

    await updateCompanyEquipmentItem(ctx, itemId, {
      name: parsed.data.name,
      type: parsed.data.type,
      serialNumber: parsed.data.serialNumber || null,
      brand: parsed.data.brand || null,
      model: parsed.data.model || null,
      purchaseDate: parsed.data.purchaseDate || null,
      purchaseCost,
      assignedTo: parsed.data.assignedTo && parsed.data.assignedTo !== "none" ? parsed.data.assignedTo : null,
      notes: parsed.data.notes || null,
      status: parsed.data.status || undefined,
      serviceIntervalDays,
      serviceIntervalHours,
    });

    revalidatePath("/settings/equipment");
    return { success: true, itemId };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to update equipment") };
  }
}

export async function deleteEquipmentAction(
  itemId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const ctx = await requireAuth();
    await deleteCompanyEquipmentItem(ctx, itemId);
    revalidatePath("/settings/equipment");
    return { success: true };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to delete equipment") };
  }
}

export async function addMaintenanceLogAction(
  _prevState: EquipmentActionState,
  formData: FormData
): Promise<EquipmentActionState> {
  try {
    const ctx = await requireAuth();
    const raw = Object.fromEntries(formData);
    const parsed = maintenanceSchema.safeParse(raw);

    if (!parsed.success) {
      return {
        error: "Please fix the errors below",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const cost = parsed.data.cost ? parseFloat(parsed.data.cost) : undefined;
    if (cost !== undefined && isNaN(cost)) {
      return { error: "Invalid cost" };
    }

    const hoursAtService = parsed.data.hoursAtService
      ? parseInt(parsed.data.hoursAtService)
      : undefined;

    await addMaintenanceLog(ctx, parsed.data.equipmentId, {
      type: parsed.data.type,
      description: parsed.data.description || undefined,
      cost,
      performedAt: parsed.data.performedAt,
      hoursAtService,
    });

    revalidatePath(`/settings/equipment/${parsed.data.equipmentId}`);
    return { success: true, itemId: parsed.data.equipmentId };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to add maintenance log") };
  }
}
