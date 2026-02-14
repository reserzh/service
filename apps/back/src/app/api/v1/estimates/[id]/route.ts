import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { getEstimateWithRelations, updateEstimate } from "@/lib/services/estimates";
import { handleApiError } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    const data = await getEstimateWithRelations(ctx, id);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

const updateSchema = z.object({
  summary: z.string().min(1).max(500).optional(),
  notes: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    const body = await req.json();
    const input = updateSchema.parse(body);
    const data = await updateEstimate(ctx, id, input);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
