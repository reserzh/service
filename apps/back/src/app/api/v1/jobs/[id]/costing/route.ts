import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError, validateUUID } from "@/lib/api/errors";
import { getJobCosting } from "@/lib/services/job-costing";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);
    const costing = await getJobCosting(ctx, id);
    return NextResponse.json({ data: costing });
  } catch (error) {
    return handleApiError(error);
  }
}
