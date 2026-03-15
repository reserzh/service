"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import {
  createInvoice,
  updateInvoice,
  updateInvoiceFull,
  sendInvoice,
  voidInvoice,
  deleteInvoice,
  addInvoiceLineItem,
  deleteInvoiceLineItem,
  recordPayment,
  generateInvoiceFromJob,
} from "@/lib/services/invoices";
import { getActionErrorMessage } from "@/lib/api/errors";

// ---------- Schemas ----------

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Price must be 0 or more"),
  type: z.enum(["service", "material", "labor", "discount", "other"]).optional(),
});

const createInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  jobId: z.string().uuid().optional().or(z.literal("")),
  estimateId: z.string().uuid().optional().or(z.literal("")),
  dueDate: z.string().min(1, "Due date is required"),
  taxRate: z.coerce.number().min(0).max(1).optional(),
  notes: z.string().optional().or(z.literal("")),
  internalNotes: z.string().optional().or(z.literal("")),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  method: z.enum(["credit_card", "debit_card", "ach", "cash", "check", "other"]),
  referenceNumber: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

// ---------- Types ----------

export type InvoiceActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  invoiceId?: string;
};

// ---------- Create ----------

export async function createInvoiceAction(
  input: z.infer<typeof createInvoiceSchema>
): Promise<InvoiceActionState> {
  try {
    const ctx = await requireAuth();
    const parsed = createInvoiceSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: "Please fix the errors below.",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = parsed.data;
    const invoice = await createInvoice(ctx, {
      customerId: data.customerId,
      jobId: data.jobId || undefined,
      estimateId: data.estimateId || undefined,
      dueDate: data.dueDate,
      taxRate: data.taxRate,
      notes: data.notes || undefined,
      internalNotes: data.internalNotes || undefined,
      lineItems: data.lineItems,
    });

    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to create invoice.") };
  }
}

// ---------- Update ----------

export async function updateInvoiceAction(
  invoiceId: string,
  input: { dueDate?: string; taxRate?: number; notes?: string; internalNotes?: string }
): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    await updateInvoice(ctx, invoiceId, input);

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);

    return {};
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to update invoice.") };
  }
}

// ---------- Send ----------

export async function sendInvoiceAction(invoiceId: string): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    await sendInvoice(ctx, invoiceId);

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/dashboard");

    return {};
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to send invoice.") };
  }
}

// ---------- Void ----------

export async function voidInvoiceAction(invoiceId: string): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    await voidInvoice(ctx, invoiceId);

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/dashboard");

    return {};
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to void invoice.") };
  }
}

// ---------- Line Items ----------

export async function addInvoiceLineItemAction(
  invoiceId: string,
  _prevState: InvoiceActionState,
  formData: FormData
): Promise<InvoiceActionState> {
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

    await addInvoiceLineItem(ctx, invoiceId, parsed.data);

    revalidatePath(`/invoices/${invoiceId}`);
    return { success: true };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to add line item.") };
  }
}

export async function deleteInvoiceLineItemAction(
  invoiceId: string,
  itemId: string
): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    await deleteInvoiceLineItem(ctx, invoiceId, itemId);

    revalidatePath(`/invoices/${invoiceId}`);
    return {};
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to delete line item.") };
  }
}

// ---------- Record Payment ----------

export async function recordPaymentAction(
  invoiceId: string,
  input: z.infer<typeof paymentSchema>
): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    const parsed = paymentSchema.safeParse(input);

    if (!parsed.success) {
      return { error: "Invalid payment data." };
    }

    await recordPayment(ctx, invoiceId, {
      amount: parsed.data.amount,
      method: parsed.data.method,
      referenceNumber: parsed.data.referenceNumber || undefined,
      notes: parsed.data.notes || undefined,
    });

    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return {};
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to record payment.") };
  }
}

// ---------- Delete (draft only) ----------

export async function deleteInvoiceAction(invoiceId: string): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();
    await deleteInvoice(ctx, invoiceId);

    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return {};
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to delete invoice.") };
  }
}

// ---------- Full Update (with line items replacement) ----------

export async function updateInvoiceFullAction(
  invoiceId: string,
  input: {
    dueDate?: string;
    taxRate?: number;
    notes?: string;
    internalNotes?: string;
    lineItems?: { description: string; quantity: number; unitPrice: number; type?: string }[];
  }
): Promise<InvoiceActionState> {
  try {
    const ctx = await requireAuth();

    await updateInvoiceFull(ctx, invoiceId, {
      dueDate: input.dueDate,
      taxRate: input.taxRate,
      notes: input.notes !== undefined ? (input.notes || null) : undefined,
      internalNotes: input.internalNotes !== undefined ? (input.internalNotes || null) : undefined,
      lineItems: input.lineItems?.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        type: item.type as "service" | "material" | "labor" | "discount" | "other" | undefined,
      })),
    });

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/dashboard");

    return { success: true, invoiceId };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to update invoice.") };
  }
}

// ---------- Generate from Job ----------

export async function generateInvoiceFromJobAction(
  jobId: string,
  dueDate: string,
  taxRate: number = 0
): Promise<InvoiceActionState> {
  try {
    const ctx = await requireAuth();
    const invoice = await generateInvoiceFromJob(ctx, jobId, dueDate, taxRate);

    revalidatePath("/invoices");
    revalidatePath("/dashboard");
    revalidatePath(`/jobs/${jobId}`);

    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to generate invoice.") };
  }
}
