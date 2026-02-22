import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { getAgreementVisits, generateVisitJob } from "@/lib/services/agreements";
import { handleApiError, validateUUID } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);
    const visits = await getAgreementVisits(ctx, id);
    return NextResponse.json({ data: visits });
  } catch (error) {
    return handleApiError(error);
  }
}

const generateJobSchema = z.object({
  visitId: z.string().uuid(),
});

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);
    const body = await req.json();
    const { visitId } = generateJobSchema.parse(body);
    const job = await generateVisitJob(ctx, id, visitId);
    return NextResponse.json({ data: job }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
