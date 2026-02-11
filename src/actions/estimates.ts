"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import {
  createEstimate,
  updateEstimate,
  sendEstimate,
  approveEstimate,
  declineEstimate,
  addEstimateOption,
  deleteEstimateOption,
} from "@/lib/services/estimates";

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
    console.error("Create estimate error:", error);
    const message = error instanceof Error ? error.message : "Failed to create estimate.";
    return { error: message };
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
    console.error("Update estimate error:", error);
    const message = error instanceof Error ? error.message : "Failed to update estimate.";
    return { error: message };
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
    console.error("Send estimate error:", error);
    const message = error instanceof Error ? error.message : "Failed to send estimate.";
    return { error: message };
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
    console.error("Approve estimate error:", error);
    const message = error instanceof Error ? error.message : "Failed to approve estimate.";
    return { error: message };
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
    console.error("Decline estimate error:", error);
    const message = error instanceof Error ? error.message : "Failed to decline estimate.";
    return { error: message };
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
    console.error("Add option error:", error);
    const message = error instanceof Error ? error.message : "Failed to add option.";
    return { error: message };
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
    console.error("Delete option error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete option.";
    return { error: message };
  }
}
