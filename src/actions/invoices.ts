"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import {
  createInvoice,
  updateInvoice,
  sendInvoice,
  voidInvoice,
  addInvoiceLineItem,
  deleteInvoiceLineItem,
  recordPayment,
  generateInvoiceFromJob,
} from "@/lib/services/invoices";

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
    console.error("Create invoice error:", error);
    const message = error instanceof Error ? error.message : "Failed to create invoice.";
    return { error: message };
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
    console.error("Update invoice error:", error);
    const message = error instanceof Error ? error.message : "Failed to update invoice.";
    return { error: message };
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
    console.error("Send invoice error:", error);
    const message = error instanceof Error ? error.message : "Failed to send invoice.";
    return { error: message };
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
    console.error("Void invoice error:", error);
    const message = error instanceof Error ? error.message : "Failed to void invoice.";
    return { error: message };
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
    console.error("Add line item error:", error);
    return { error: "Failed to add line item." };
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
    console.error("Delete line item error:", error);
    return { error: "Failed to delete line item." };
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
    console.error("Record payment error:", error);
    const message = error instanceof Error ? error.message : "Failed to record payment.";
    return { error: message };
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
    console.error("Generate invoice error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate invoice.";
    return { error: message };
  }
}
