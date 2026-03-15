"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import {
  createEstimate,
  updateEstimateFull,
  updateEstimate,
  sendEstimate,
  approveEstimate,
  declineEstimate,
  addEstimateOption,
  deleteEstimateOption,
  deleteEstimate,
} from "@/lib/services/estimates";
import { getActionErrorMessage } from "@/lib/api/errors";

// ---------- Schemas ----------

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Price must be 0 or more"),
  type: z.enum(["service", "material", "labor", "discount", "other"]).optional(),
});

const optionSchema = z.object({
  name: z.string().min(1, "Option name is required").max(100),
  description: z.string().optional().or(z.literal("")),
  isRecommended: z.boolean().optional(),
  items: z.array(lineItemSchema).min(1, "At least one item is required"),
});

const createEstimateSchema = z.object({
  customerId: z.string().uuid(),
  propertyId: z.string().uuid(),
  jobId: z.string().uuid().optional().or(z.literal("")),
  summary: z.string().min(1, "Summary is required").max(500),
  notes: z.string().optional().or(z.literal("")),
  internalNotes: z.string().optional().or(z.literal("")),
  validUntil: z.string().optional().or(z.literal("")),
  options: z.array(optionSchema).min(1, "At least one option is required"),
});

// ---------- Types ----------

export type EstimateActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  estimateId?: string;
};

// ---------- Create ----------

export async function createEstimateAction(
  input: z.infer<typeof createEstimateSchema>
): Promise<EstimateActionState> {
  try {
    const ctx = await requireAuth();
    const parsed = createEstimateSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: "Please fix the errors below.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = parsed.data;
    const estimate = await createEstimate(ctx, {
      customerId: data.customerId,
      propertyId: data.propertyId,
      jobId: data.jobId || undefined,
      summary: data.summary,
      notes: data.notes || undefined,
      internalNotes: data.internalNotes || undefined,
      validUntil: data.validUntil || undefined,
      options: data.options.map((opt) => ({
        name: opt.name,
        description: opt.description || undefined,
        isRecommended: opt.isRecommended,
        items: opt.items,
      })),
    });

    revalidatePath("/estimates");
    revalidatePath("/dashboard");

    return { success: true, estimateId: estimate.id };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to create estimate.") };
  }
}

// ---------- Update ----------

export async function updateEstimateAction(
  estimateId: string,
  input: { summary?: string; notes?: string; internalNotes?: string; validUntil?: string }
): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    await updateEstimate(ctx, estimateId, input);

    revalidatePath("/estimates");
    revalidatePath(`/estimates/${estimateId}`);

    return {};
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to update estimate.") };
  }
}

// ---------- Send ----------

export async function sendEstimateAction(estimateId: string): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    await sendEstimate(ctx, estimateId);

    revalidatePath("/estimates");
    revalidatePath(`/estimates/${estimateId}`);
    revalidatePath("/dashboard");

    return {};
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to send estimate.") };
  }
}

// ---------- Approve ----------

export async function approveEstimateAction(
  estimateId: string,
  optionId: string
): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    await approveEstimate(ctx, estimateId, optionId);

    revalidatePath("/estimates");
    revalidatePath(`/estimates/${estimateId}`);
    revalidatePath("/dashboard");

    return {};
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to approve estimate.") };
  }
}

// ---------- Decline ----------

export async function declineEstimateAction(estimateId: string): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    await declineEstimate(ctx, estimateId);

    revalidatePath("/estimates");
    revalidatePath(`/estimates/${estimateId}`);

    return {};
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to decline estimate.") };
  }
}

// ---------- Add Option ----------

export async function addEstimateOptionAction(
  estimateId: string,
  input: z.infer<typeof optionSchema>
): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    const parsed = optionSchema.safeParse(input);

    if (!parsed.success) {
      return { error: "Invalid option data." };
    }

    await addEstimateOption(ctx, estimateId, {
      name: parsed.data.name,
      description: parsed.data.description || undefined,
      isRecommended: parsed.data.isRecommended,
      items: parsed.data.items,
    });

    revalidatePath(`/estimates/${estimateId}`);
    return {};
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to add option.") };
  }
}

// ---------- Delete Option ----------

export async function deleteEstimateOptionAction(
  estimateId: string,
  optionId: string
): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    await deleteEstimateOption(ctx, estimateId, optionId);

    revalidatePath(`/estimates/${estimateId}`);
    return {};
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to delete option.") };
  }
}

// ---------- Delete Estimate ----------

export async function deleteEstimateAction(estimateId: string): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    await deleteEstimate(ctx, estimateId);

    revalidatePath("/estimates");
    revalidatePath("/dashboard");

    return {};
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to delete estimate.") };
  }
}

// ---------- Full Update (with options/items) ----------

const updateEstimateFullSchema = z.object({
  summary: z.string().min(1, "Summary is required").max(500),
  notes: z.string().optional().or(z.literal("")),
  internalNotes: z.string().optional().or(z.literal("")),
  validUntil: z.string().optional().or(z.literal("")),
  options: z.array(optionSchema).min(1, "At least one option is required"),
});

export async function updateEstimateFullAction(
  estimateId: string,
  input: z.infer<typeof updateEstimateFullSchema>
): Promise<EstimateActionState> {
  try {
    const ctx = await requireAuth();
    const parsed = updateEstimateFullSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: "Please fix the errors below.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = parsed.data;
    await updateEstimateFull(ctx, estimateId, {
      summary: data.summary,
      notes: data.notes || null,
      internalNotes: data.internalNotes || null,
      validUntil: data.validUntil || null,
      options: data.options.map((opt) => ({
        name: opt.name,
        description: opt.description || undefined,
        isRecommended: opt.isRecommended,
        items: opt.items,
      })),
    });

    revalidatePath("/estimates");
    revalidatePath(`/estimates/${estimateId}`);
    revalidatePath("/dashboard");

    return { success: true, estimateId };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to update estimate.") };
  }
}
