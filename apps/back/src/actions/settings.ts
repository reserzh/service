"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import {
  updateCompanyProfile,
  updateTenantSettings,
} from "@/lib/services/settings";
import type { TenantSettings } from "@fieldservice/shared/db/schema/tenants";
import { getActionErrorMessage } from "@/lib/api/errors";
import { TRADE_TYPES } from "@fieldservice/api-types/constants";

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
    return { error: getActionErrorMessage(error, "Failed to update company profile.") };
  }
}

// ---------- Update services/tax settings ----------

const businessHourSlot = z.object({ open: z.string(), close: z.string() }).nullable();

const servicesSettingsSchema = z.object({
  defaultTaxRate: z.number().min(0).max(1).optional(),
  businessHours: z.record(z.string(), businessHourSlot).optional(),
  invoiceTerms: z.string().max(10000).optional(),
  estimateTerms: z.string().max(10000).optional(),
});

export async function updateServicesSettingsAction(
  input: Partial<TenantSettings>
): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    const parsed = servicesSettingsSchema.parse(input);
    await updateTenantSettings(ctx, parsed as Partial<TenantSettings>);

    revalidatePath("/settings");
    revalidatePath("/settings/services");

    return {};
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to update settings.") };
  }
}

// ---------- Update dashboard settings ----------

const VALID_PRESETS = ["classic", "blueprint", "mission-control", "glass", "executive", "arctic", "forge", "copper"];
const VALID_WIDGETS = ["stats", "quick-actions", "schedule", "activity", "chart", "team"];

const dashboardSettingsSchema = z.object({
  dashboardPreset: z.string().refine((v) => VALID_PRESETS.includes(v), "Invalid preset"),
  dashboardHiddenWidgets: z.array(z.string().refine((v) => VALID_WIDGETS.includes(v), "Invalid widget")),
});

export async function updateDashboardSettingsAction(
  input: { dashboardPreset: string; dashboardHiddenWidgets: string[] }
): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    const parsed = dashboardSettingsSchema.parse(input);
    await updateTenantSettings(ctx, parsed as Partial<TenantSettings>);

    revalidatePath("/settings");
    revalidatePath("/settings/dashboard");
    revalidatePath("/dashboard");
    revalidatePath("/", "layout");

    return {};
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to update dashboard settings.") };
  }
}

// ---------- Update quote availability ----------

const timeWindowSchema = z.object({ start: z.string(), end: z.string() }).refine(
  (w) => w.start < w.end,
  { message: "Start time must be before end time" }
);
const quoteAvailabilitySchema = z.object({
  enabled: z.boolean(),
  windows: z.record(z.string(), z.array(timeWindowSchema).nullable()),
  leadTimeDays: z.number().int().min(0).max(90).optional(),
  maxAdvanceDays: z.number().int().min(1).max(365).optional(),
});

export async function updateQuoteAvailabilityAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  try {
    const ctx = await requireAuth();
    assertPermission(ctx, "settings", "update");
    const raw = formData.get("data");
    if (!raw || typeof raw !== "string") return { error: "Invalid data" };
    const parsed = quoteAvailabilitySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return { error: "Invalid availability configuration" };

    await updateTenantSettings(ctx, { quoteAvailability: parsed.data as TenantSettings["quoteAvailability"] });
    revalidatePath("/settings/booking-availability");
    return { success: true };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to update availability") };
  }
}

// ---------- Update industry settings ----------

const industrySettingsSchema = z.object({
  tradeType: z.enum(TRADE_TYPES as unknown as [string, ...string[]]),
  operatorType: z.enum(["solo", "crew"]),
  landscaping: z
    .object({
      defaultServiceZones: z.array(z.string().max(100)).max(20).optional(),
      measurementUnit: z.enum(["sqft", "acre"]).optional(),
      seasonalScheduling: z.boolean().optional(),
    })
    .optional(),
});

export async function updateIndustrySettingsAction(
  input: z.infer<typeof industrySettingsSchema>
): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    assertPermission(ctx, "settings", "update");
    const parsed = industrySettingsSchema.parse(input);
    await updateTenantSettings(ctx, parsed as Partial<TenantSettings>);

    revalidatePath("/settings");
    revalidatePath("/settings/industry");
    revalidatePath("/", "layout");

    return {};
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to update industry settings.") };
  }
}
