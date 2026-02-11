"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import {
  updateTeamMember,
  deactivateTeamMember,
  reactivateTeamMember,
} from "@/lib/services/team";

// ---------- Schemas ----------

const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.enum(["admin", "office_manager", "dispatcher", "csr", "technician"]).optional(),
  phone: z.string().max(50).optional().or(z.literal("")).transform((v) => v || null),
  hourlyRate: z.coerce.number().min(0).optional().or(z.literal("")).transform((v) => v || null),
  canBeDispatched: z.boolean().optional(),
  color: z.string().max(7).optional(),
});

// ---------- Types ----------

export type TeamActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

// ---------- Update team member ----------

export async function updateTeamMemberAction(
  userId: string,
  _prevState: TeamActionState,
  formData: FormData
): Promise<TeamActionState> {
  try {
    const ctx = await requireAuth();
    const raw = Object.fromEntries(formData);

    // Handle checkbox for canBeDispatched
    const data = {
      ...raw,
      canBeDispatched: formData.get("canBeDispatched") === "on" || formData.get("canBeDispatched") === "true",
    };

    const parsed = updateUserSchema.safeParse(data);

    if (!parsed.success) {
      return {
        error: "Please fix the errors below.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    await updateTeamMember(ctx, userId, {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      role: parsed.data.role,
      phone: parsed.data.phone,
      hourlyRate: parsed.data.hourlyRate as number | null,
      canBeDispatched: parsed.data.canBeDispatched,
      color: parsed.data.color,
    });

    revalidatePath("/settings/team");
    revalidatePath(`/settings/team/${userId}`);

    return { success: true };
  } catch (error) {
    console.error("Update team member error:", error);
    const message = error instanceof Error ? error.message : "Failed to update team member.";
    return { error: message };
  }
}

// ---------- Deactivate ----------

export async function deactivateTeamMemberAction(userId: string): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    await deactivateTeamMember(ctx, userId);

    revalidatePath("/settings/team");

    return {};
  } catch (error) {
    console.error("Deactivate team member error:", error);
    const message = error instanceof Error ? error.message : "Failed to deactivate team member.";
    return { error: message };
  }
}

// ---------- Reactivate ----------

export async function reactivateTeamMemberAction(userId: string): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    await reactivateTeamMember(ctx, userId);

    revalidatePath("/settings/team");

    return {};
  } catch (error) {
    console.error("Reactivate team member error:", error);
    const message = error instanceof Error ? error.message : "Failed to reactivate team member.";
    return { error: message };
  }
}
