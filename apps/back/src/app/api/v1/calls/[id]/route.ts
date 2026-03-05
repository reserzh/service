import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { getCall, updateCall } from "@/lib/services/calls";
import { handleApiError, validateUUID } from "@/lib/api/errors";

const updateSchema = z.object({
  notes: z.string().optional(),
  customerId: z.string().uuid().nullable().optional(),
  jobId: z.string().uuid().nullable().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await params;
    validateUUID(id);
    const call = await getCall(ctx, id);
    return NextResponse.json({ data: call });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await params;
    validateUUID(id);
    const body = await req.json();
    const input = updateSchema.parse(body);
    const call = await updateCall(ctx, id, input);
    return NextResponse.json({ data: call });
  } catch (error) {
    return handleApiError(error);
  }
}
