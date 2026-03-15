"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/lib/services/customers";
import { getActionErrorMessage } from "@/lib/api/errors";

const createCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(1, "Phone is required").max(50),
  altPhone: z.string().max(50).optional().or(z.literal("")),
  companyName: z.string().max(255).optional().or(z.literal("")),
  type: z.enum(["residential", "commercial"]).optional(),
  source: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  addressLine1: z.string().optional().or(z.literal("")),
  addressLine2: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zip: z.string().optional().or(z.literal("")),
});

export type CustomerActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  customerId?: string;
};

export async function createCustomerAction(
  _prevState: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  try {
    const ctx = await requireAuth();

    const raw = Object.fromEntries(formData);
    const parsed = createCustomerSchema.safeParse(raw);

    if (!parsed.success) {
      return {
        error: "Please fix the errors below.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const input = parsed.data;
    const hasProperty = input.addressLine1 && input.city && input.state && input.zip;

    const customer = await createCustomer(ctx, {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email || undefined,
      phone: input.phone,
      altPhone: input.altPhone || undefined,
      companyName: input.companyName || undefined,
      type: input.type,
      source: input.source || undefined,
      notes: input.notes || undefined,
      property: hasProperty
        ? {
            addressLine1: input.addressLine1!,
            addressLine2: input.addressLine2 || undefined,
            city: input.city!,
            state: input.state!,
            zip: input.zip!,
          }
        : undefined,
    });

    revalidatePath("/customers");

    return { success: true, customerId: customer.id };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to create customer. Please try again.") };
  }
}

// ---------- Update ----------

const updateCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(1, "Phone is required").max(50),
  altPhone: z.string().max(50).optional().or(z.literal("")),
  companyName: z.string().max(255).optional().or(z.literal("")),
  type: z.enum(["residential", "commercial"]).optional(),
  source: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  doNotContact: z.string().optional(),
});

export async function updateCustomerAction(
  customerId: string,
  _prevState: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  try {
    const ctx = await requireAuth();

    const raw = Object.fromEntries(formData);
    const parsed = updateCustomerSchema.safeParse(raw);

    if (!parsed.success) {
      return {
        error: "Please fix the errors below.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const input = parsed.data;

    const updateData: import("@/lib/services/customers").UpdateCustomerInput = {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email || null,
      phone: input.phone,
      altPhone: input.altPhone || null,
      companyName: input.companyName || null,
      type: input.type,
      source: input.source || null,
      notes: input.notes || null,
    };
    // Only include doNotContact if explicitly set in form data
    if (input.doNotContact !== undefined) {
      updateData.doNotContact = input.doNotContact === "true";
    }

    await updateCustomer(ctx, customerId, updateData);

    revalidatePath("/customers");
    revalidatePath(`/customers/${customerId}`);

    return { success: true, customerId };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to update customer. Please try again.") };
  }
}

// ---------- Delete ----------

export async function deleteCustomerAction(customerId: string): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    await deleteCustomer(ctx, customerId);
    revalidatePath("/customers");
    return {};
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to delete customer.") };
  }
}
