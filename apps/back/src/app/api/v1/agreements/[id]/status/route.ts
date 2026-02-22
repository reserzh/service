import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { changeAgreementStatus } from "@/lib/services/agreements";
import { handleApiError, validateUUID } from "@/lib/api/errors";

const statusSchema = z.object({
  status: z.enum(["draft", "active", "paused", "completed", "canceled"]),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);
    const body = await req.json();
    const { status } = statusSchema.parse(body);
    const agreement = await changeAgreementStatus(ctx, id, status);
    return NextResponse.json({ data: agreement });
  } catch (error) {
    return handleApiError(error);
  }
}
