"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { updateCall, initiateCall } from "@/lib/services/calls";
import { getActionErrorMessage } from "@/lib/api/errors";

export type CallActionState = {
  error?: string;
  success?: boolean;
};

export async function updateCallNotesAction(
  callId: string,
  notes: string
): Promise<CallActionState> {
  try {
    const ctx = await requireAuth();
    await updateCall(ctx, callId, { notes });
    revalidatePath(`/calls/${callId}`);
    return { success: true };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to update notes.") };
  }
}

export async function linkCallToJobAction(
  callId: string,
  jobId: string | null
): Promise<CallActionState> {
  try {
    const ctx = await requireAuth();
    await updateCall(ctx, callId, { jobId });
    revalidatePath(`/calls/${callId}`);
    return { success: true };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to link call to job.") };
  }
}

export async function linkCallToCustomerAction(
  callId: string,
  customerId: string | null
): Promise<CallActionState> {
  try {
    const ctx = await requireAuth();
    await updateCall(ctx, callId, { customerId });
    revalidatePath(`/calls/${callId}`);
    return { success: true };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to link call to customer.") };
  }
}

const initiateSchema = z.object({
  toNumber: z.string().min(1, "Phone number is required").max(50),
  jobId: z.string().uuid().optional(),
});

export async function initiateCallAction(
  _prevState: CallActionState,
  formData: FormData
): Promise<CallActionState> {
  try {
    const ctx = await requireAuth();
    const raw = Object.fromEntries(formData);
    const parsed = initiateSchema.safeParse(raw);

    if (!parsed.success) {
      return { error: parsed.error.issues.map((i) => i.message).join(", ") };
    }

    await initiateCall(ctx, parsed.data);
    revalidatePath("/calls");
    return { success: true };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to initiate call.") };
  }
}
