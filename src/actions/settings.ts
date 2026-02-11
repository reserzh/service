"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import {
  updateCompanyProfile,
  updateTenantSettings,
} from "@/lib/services/settings";
import type { TenantSettings } from "@/lib/db/schema/tenants";

// ---------- Schemas ----------

const companyProfileSchema = z.object({
  name: z.string().min(1, "Company name is required").max(255),
  email: z.string().email("Valid email is required"),
  phone: z.string().max(50).optional().or(z.literal("")),
  addressLine1: z.string().max(255).optional().or(z.literal("")),
  addressLine2: z.string().max(255).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(50).optional().or(z.literal("")),
  zip: z.string().max(20).optional().or(z.literal("")),
  timezone: z.string().max(50).optional(),
  website: z.string().max(255).optional().or(z.literal("")),
  licenseNumber: z.string().max(100).optional().or(z.literal("")),
});

// ---------- Types ----------

export type SettingsActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

// ---------- Update company profile ----------

export async function updateCompanyProfileAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  try {
    const ctx = await requireAuth();
    const raw = Object.fromEntries(formData);
    const parsed = companyProfileSchema.safeParse(raw);

    if (!parsed.success) {
      return {
        error: "Please fix the errors below.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = parsed.data;
    await updateCompanyProfile(ctx, {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      addressLine1: data.addressLine1 || null,
      addressLine2: data.addressLine2 || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zip || null,
      timezone: data.timezone,
      website: data.website || null,
      licenseNumber: data.licenseNumber || null,
    });

    revalidatePath("/settings");
    revalidatePath("/settings/company");

    return { success: true };
  } catch (error) {
    console.error("Update company profile error:", error);
    const message = error instanceof Error ? error.message : "Failed to update company profile.";
    return { error: message };
  }
}

// ---------- Update services/tax settings ----------

export async function updateServicesSettingsAction(
  input: {
    defaultTaxRate?: number;
    businessHours?: TenantSettings["businessHours"];
    invoiceTerms?: string;
    estimateTerms?: string;
  }
): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    await updateTenantSettings(ctx, input);

    revalidatePath("/settings");
    revalidatePath("/settings/services");

    return {};
  } catch (error) {
    console.error("Update services settings error:", error);
    const message = error instanceof Error ? error.message : "Failed to update settings.";
    return { error: message };
  }
}
