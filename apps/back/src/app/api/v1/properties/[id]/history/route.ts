import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError, validateUUID } from "@/lib/api/errors";
import { getPropertyHistory } from "@/lib/services/property-history";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "5", 10), 20);

    const history = await getPropertyHistory(ctx, id, limit);
    return NextResponse.json({ data: history });
  } catch (error) {
    return handleApiError(error);
  }
}
