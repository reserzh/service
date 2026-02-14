import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { recordPayment } from "@/lib/services/invoices";
import { handleApiError } from "@/lib/api/errors";

const paymentSchema = z.object({
  amount: z.number().min(0.01),
  method: z.enum(["credit_card", "debit_card", "ach", "cash", "check", "other"]),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    const body = await req.json();
    const input = paymentSchema.parse(body);
    const payment = await recordPayment(ctx, id, input);
    return NextResponse.json({ data: payment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
