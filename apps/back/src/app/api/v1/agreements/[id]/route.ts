import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { getAgreementWithRelations, updateAgreement } from "@/lib/services/agreements";
import { handleApiError, validateUUID } from "@/lib/api/errors";

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  billingFrequency: z.enum(["monthly", "quarterly", "semi_annual", "annual", "one_time"]).optional(),
  billingAmount: z.number().min(0).optional(),
  totalValue: z.number().min(0).optional(),
  visitsPerYear: z.number().int().min(0).optional(),
  autoRenew: z.boolean().optional(),
  renewalReminderDays: z.number().int().optional(),
  notes: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);
    const agreement = await getAgreementWithRelations(ctx, id);
    return NextResponse.json({ data: agreement });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);
    const body = await req.json();
    const input = updateSchema.parse(body);
    const agreement = await updateAgreement(ctx, id, input);
    return NextResponse.json({ data: agreement });
  } catch (error) {
    return handleApiError(error);
  }
}
