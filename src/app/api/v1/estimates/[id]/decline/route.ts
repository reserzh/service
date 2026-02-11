import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { declineEstimate } from "@/lib/services/estimates";
import { handleApiError } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    const data = await declineEstimate(ctx, id);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
