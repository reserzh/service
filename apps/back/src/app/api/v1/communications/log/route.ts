import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { listCommunicationLog } from "@/lib/services/communications";
import { handleApiError } from "@/lib/api/errors";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const params = req.nextUrl.searchParams;

    const result = await listCommunicationLog(ctx, {
      page: params.get("page") ? parseInt(params.get("page")!) : undefined,
      pageSize: params.get("pageSize") ? parseInt(params.get("pageSize")!) : undefined,
      entityType: params.get("entityType") || undefined,
      entityId: params.get("entityId") || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
