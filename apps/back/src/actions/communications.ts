"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/lib/services/communications";
import { getActionErrorMessage } from "@/lib/api/errors";

const templateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  trigger: z.string().max(100).optional().or(z.literal("")),
  subject: z.string().min(1, "Subject is required").max(500),
  body: z.string().min(1, "Body is required"),
  isActive: z.string().optional(),
  isDefault: z.string().optional(),
});

export type TemplateActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  templateId?: string;
};

export async function createTemplateAction(
  _prevState: TemplateActionState,
  formData: FormData
): Promise<TemplateActionState> {
  try {
    const ctx = await requireAuth();
    const raw = Object.fromEntries(formData);
    const parsed = templateSchema.safeParse(raw);

    if (!parsed.success) {
      return {
        error: "Please fix the errors below",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const template = await createTemplate(ctx, {
      name: parsed.data.name,
      trigger: parsed.data.trigger || undefined,
      subject: parsed.data.subject,
      body: parsed.data.body,
      isActive: parsed.data.isActive !== "false",
      isDefault: parsed.data.isDefault === "true",
    });

    revalidatePath("/settings/notifications");
    return { success: true, templateId: template.id };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to create template") };
  }
}

export async function updateTemplateAction(
  _prevState: TemplateActionState,
  formData: FormData
): Promise<TemplateActionState> {
  try {
    const ctx = await requireAuth();
    const templateId = formData.get("id") as string;
    const raw = Object.fromEntries(formData);
    const parsed = templateSchema.safeParse(raw);

    if (!parsed.success) {
      return {
        error: "Please fix the errors below",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    await updateTemplate(ctx, templateId, {
      name: parsed.data.name,
      trigger: parsed.data.trigger || null,
      subject: parsed.data.subject,
      body: parsed.data.body,
      isActive: parsed.data.isActive !== "false",
      isDefault: parsed.data.isDefault === "true",
    });

    revalidatePath("/settings/notifications");
    return { success: true, templateId };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to update template") };
  }
}

export async function deleteTemplateAction(
  templateId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const ctx = await requireAuth();
    await deleteTemplate(ctx, templateId);
    revalidatePath("/settings/notifications");
    return { success: true };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to delete template") };
  }
}
