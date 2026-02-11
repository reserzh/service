"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import {
  createJob,
  updateJob,
  changeJobStatus,
  assignJob,
  addJobLineItem,
  updateJobLineItem,
  deleteJobLineItem,
  addJobNote,
} from "@/lib/services/jobs";

// ---------- Schemas ----------

const createJobSchema = z.object({
  customerId: z.string().uuid(),
  propertyId: z.string().uuid(),
  jobType: z.string().min(1, "Job type is required").max(100),
  serviceType: z.string().max(100).optional().or(z.literal("")),
  summary: z.string().min(1, "Summary is required").max(500),
  description: z.string().optional().or(z.literal("")),
  priority: z.enum(["low", "normal", "high", "emergency"]).optional(),
  assignedTo: z.string().uuid().optional().or(z.literal("")),
  scheduledStart: z.string().optional().or(z.literal("")),
  scheduledEnd: z.string().optional().or(z.literal("")),
  internalNotes: z.string().optional().or(z.literal("")),
  customerNotes: z.string().optional().or(z.literal("")),
});

const updateJobSchema = z.object({
  jobType: z.string().min(1).max(100).optional(),
  serviceType: z.string().max(100).optional().or(z.literal("")).transform((v) => v || null),
  summary: z.string().min(1).max(500).optional(),
  description: z.string().optional().or(z.literal("")).transform((v) => v || null),
  priority: z.enum(["low", "normal", "high", "emergency"]).optional(),
  assignedTo: z.string().uuid().optional().or(z.literal("")).transform((v) => v || null),
  scheduledStart: z.string().optional().or(z.literal("")).transform((v) => v || null),
  scheduledEnd: z.string().optional().or(z.literal("")).transform((v) => v || null),
  internalNotes: z.string().optional().or(z.literal("")).transform((v) => v || null),
  customerNotes: z.string().optional().or(z.literal("")).transform((v) => v || null),
});

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Price must be 0 or more"),
  type: z.enum(["service", "material", "labor", "discount", "other"]).optional(),
});

// ---------- Types ----------

export type JobActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  jobId?: string;
};

// ---------- Create Job ----------

export async function createJobAction(
  _prevState: JobActionState,
  formData: FormData
): Promise<JobActionState> {
  try {
    const ctx = await requireAuth();
    const raw = Object.fromEntries(formData);
    const parsed = createJobSchema.safeParse(raw);

    if (!parsed.success) {
      return {
        error: "Please fix the errors below.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const input = parsed.data;

    const job = await createJob(ctx, {
      customerId: input.customerId,
      propertyId: input.propertyId,
      jobType: input.jobType,
      serviceType: input.serviceType || undefined,
      summary: input.summary,
      description: input.description || undefined,
      priority: input.priority,
      assignedTo: input.assignedTo || undefined,
      scheduledStart: input.scheduledStart || undefined,
      scheduledEnd: input.scheduledEnd || undefined,
      internalNotes: input.internalNotes || undefined,
      customerNotes: input.customerNotes || undefined,
    });

    revalidatePath("/jobs");
    revalidatePath("/schedule");
    revalidatePath("/dispatch");
    revalidatePath("/dashboard");

    return { success: true, jobId: job.id };
  } catch (error) {
    console.error("Create job error:", error);
    const message = error instanceof Error ? error.message : "Failed to create job.";
    return { error: message };
  }
}

// ---------- Update Job ----------

export async function updateJobAction(
  jobId: string,
  _prevState: JobActionState,
  formData: FormData
): Promise<JobActionState> {
  try {
    const ctx = await requireAuth();
    const raw = Object.fromEntries(formData);
    const parsed = updateJobSchema.safeParse(raw);

    if (!parsed.success) {
      return {
        error: "Please fix the errors below.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    await updateJob(ctx, jobId, parsed.data);

    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/schedule");
    revalidatePath("/dispatch");

    return { success: true };
  } catch (error) {
    console.error("Update job error:", error);
    const message = error instanceof Error ? error.message : "Failed to update job.";
    return { error: message };
  }
}

// ---------- Change Status ----------

export async function changeJobStatusAction(
  jobId: string,
  newStatus: "new" | "scheduled" | "dispatched" | "in_progress" | "completed" | "canceled"
): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    await changeJobStatus(ctx, jobId, newStatus);

    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/schedule");
    revalidatePath("/dispatch");
    revalidatePath("/dashboard");

    return {};
  } catch (error) {
    console.error("Change status error:", error);
    const message = error instanceof Error ? error.message : "Failed to change status.";
    return { error: message };
  }
}

// ---------- Assign ----------

export async function assignJobAction(
  jobId: string,
  technicianId: string | null
): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    await assignJob(ctx, jobId, technicianId);

    revalidatePath("/jobs");
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/schedule");
    revalidatePath("/dispatch");

    return {};
  } catch (error) {
    console.error("Assign job error:", error);
    const message = error instanceof Error ? error.message : "Failed to assign job.";
    return { error: message };
  }
}

// ---------- Line Items ----------

export async function addLineItemAction(
  jobId: string,
  _prevState: JobActionState,
  formData: FormData
): Promise<JobActionState> {
  try {
    const ctx = await requireAuth();
    const raw = Object.fromEntries(formData);
    const parsed = lineItemSchema.safeParse(raw);

    if (!parsed.success) {
      return {
        error: "Please fix the errors.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    await addJobLineItem(ctx, jobId, parsed.data);

    revalidatePath(`/jobs/${jobId}`);
    return { success: true };
  } catch (error) {
    console.error("Add line item error:", error);
    return { error: "Failed to add line item." };
  }
}

export async function deleteLineItemAction(
  jobId: string,
  itemId: string
): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    await deleteJobLineItem(ctx, jobId, itemId);
    revalidatePath(`/jobs/${jobId}`);
    return {};
  } catch (error) {
    console.error("Delete line item error:", error);
    return { error: "Failed to delete line item." };
  }
}

// ---------- Notes ----------

export async function addJobNoteAction(
  jobId: string,
  formData: FormData
): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    const content = formData.get("content") as string;
    const isInternal = formData.get("isInternal") === "true";

    if (!content?.trim()) {
      return { error: "Note content is required." };
    }

    await addJobNote(ctx, jobId, content.trim(), isInternal);

    revalidatePath(`/jobs/${jobId}`);
    return {};
  } catch (error) {
    console.error("Add note error:", error);
    return { error: "Failed to add note." };
  }
}
