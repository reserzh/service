"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  createAgreement,
  updateAgreement,
  changeAgreementStatus,
  updateAgreementServices,
} from "@/lib/services/agreements";
import { getActionErrorMessage } from "@/lib/api/errors";

const agreementSchema = z.object({
  customerId: z.string().uuid("Customer is required"),
  propertyId: z.string().uuid("Property is required"),
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(2000).optional().or(z.literal("")),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  billingFrequency: z.enum(["monthly", "quarterly", "semi_annual", "annual", "one_time"]),
  billingAmount: z.string().min(1, "Billing amount is required"),
  totalValue: z.string().min(1, "Total value is required"),
  visitsPerYear: z.string().min(1, "Visits per year is required"),
  autoRenew: z.string().optional(),
  renewalReminderDays: z.string().optional(),
  notes: z.string().optional().or(z.literal("")),
  internalNotes: z.string().optional().or(z.literal("")),
});

export type AgreementActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  agreementId?: string;
};

export async function createAgreementAction(
  _prevState: AgreementActionState,
  formData: FormData
): Promise<AgreementActionState> {
  try {
    const ctx = await requireAuth();
    const raw = Object.fromEntries(formData);
    const parsed = agreementSchema.safeParse(raw);

    if (!parsed.success) {
      return {
        error: "Please fix the errors below",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const billingAmount = parseFloat(parsed.data.billingAmount);
    const totalValue = parseFloat(parsed.data.totalValue);
    const visitsPerYear = parseInt(parsed.data.visitsPerYear);

    if (isNaN(billingAmount) || billingAmount < 0) return { error: "Invalid billing amount" };
    if (isNaN(totalValue) || totalValue < 0) return { error: "Invalid total value" };
    if (isNaN(visitsPerYear) || visitsPerYear < 0) return { error: "Invalid visits per year" };

    const agreement = await createAgreement(ctx, {
      customerId: parsed.data.customerId,
      propertyId: parsed.data.propertyId,
      name: parsed.data.name,
      description: parsed.data.description || undefined,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      billingFrequency: parsed.data.billingFrequency,
      billingAmount,
      totalValue,
      visitsPerYear,
      autoRenew: parsed.data.autoRenew === "true",
      renewalReminderDays: parsed.data.renewalReminderDays ? parseInt(parsed.data.renewalReminderDays) : undefined,
      notes: parsed.data.notes || undefined,
      internalNotes: parsed.data.internalNotes || undefined,
    });

    revalidatePath("/agreements");
    return { success: true, agreementId: agreement.id };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to create agreement") };
  }
}

export async function updateAgreementAction(
  _prevState: AgreementActionState,
  formData: FormData
): Promise<AgreementActionState> {
  try {
    const ctx = await requireAuth();
    const agreementId = formData.get("id") as string;
    const raw = Object.fromEntries(formData);

    const updateSchema = z.object({
      name: z.string().min(1).max(255).optional(),
      description: z.string().max(2000).optional().or(z.literal("")),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      billingFrequency: z.enum(["monthly", "quarterly", "semi_annual", "annual", "one_time"]).optional(),
      billingAmount: z.string().optional(),
      totalValue: z.string().optional(),
      visitsPerYear: z.string().optional(),
      autoRenew: z.string().optional(),
      notes: z.string().optional().or(z.literal("")),
      internalNotes: z.string().optional().or(z.literal("")),
    });

    const parsed = updateSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: "Please fix the errors below", fieldErrors: parsed.error.flatten().fieldErrors };
    }

    await updateAgreement(ctx, agreementId, {
      name: parsed.data.name,
      description: parsed.data.description || null,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      billingFrequency: parsed.data.billingFrequency,
      billingAmount: parsed.data.billingAmount ? parseFloat(parsed.data.billingAmount) : undefined,
      totalValue: parsed.data.totalValue ? parseFloat(parsed.data.totalValue) : undefined,
      visitsPerYear: parsed.data.visitsPerYear ? parseInt(parsed.data.visitsPerYear) : undefined,
      autoRenew: parsed.data.autoRenew === "true",
      notes: parsed.data.notes || null,
      internalNotes: parsed.data.internalNotes || null,
    });

    revalidatePath("/agreements");
    return { success: true, agreementId };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to update agreement") };
  }
}

export async function changeAgreementStatusAction(
  agreementId: string,
  newStatus: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const ctx = await requireAuth();
    await changeAgreementStatus(ctx, agreementId, newStatus as import("@fieldservice/api-types/enums").AgreementStatus);
    revalidatePath("/agreements");
    return { success: true };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to change agreement status") };
  }
}

// ---------- Update Agreement Services ----------

export async function updateAgreementServicesAction(
  agreementId: string,
  services: { pricebookItemId?: string; name: string; description?: string; quantity: number; unitPrice: number }[]
): Promise<{ error?: string; success?: boolean }> {
  try {
    const ctx = await requireAuth();
    await updateAgreementServices(ctx, agreementId, services);
    revalidatePath("/agreements");
    revalidatePath(`/agreements/${agreementId}`);
    return { success: true };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to update agreement services") };
  }
}
