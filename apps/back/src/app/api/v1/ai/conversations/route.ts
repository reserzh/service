import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { listConversations } from "@/lib/services/ai";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const url = req.nextUrl;

    const result = await listConversations(ctx, {
      page: url.searchParams.get("page")
        ? parseInt(url.searchParams.get("page")!)
        : 1,
      pageSize: url.searchParams.get("pageSize")
        ? parseInt(url.searchParams.get("pageSize")!)
        : 25,
    });

    return NextResponse.json({ data: result.data, meta: result.meta });
  } catch (error) {
    return handleApiError(error);
  }
}
