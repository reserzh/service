import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { getInvoiceWithRelations, updateInvoice } from "@/lib/services/invoices";
import { handleApiError } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    const data = await getInvoiceWithRelations(ctx, id);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

const updateSchema = z.object({
  dueDate: z.string().optional(),
  taxRate: z.number().min(0).max(1).optional(),
  notes: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    const body = await req.json();
    const input = updateSchema.parse(body);
    const data = await updateInvoice(ctx, id, input);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
