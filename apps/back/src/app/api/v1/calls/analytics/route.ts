import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { getCallAnalytics } from "@/lib/services/calls";
import { handleApiError } from "@/lib/api/errors";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const url = req.nextUrl;
    const dateFrom = url.searchParams.get("dateFrom") || undefined;
    const dateTo = url.searchParams.get("dateTo") || undefined;
    const analytics = await getCallAnalytics(ctx, dateFrom, dateTo);
    return NextResponse.json({ data: analytics });
  } catch (error) {
    return handleApiError(error);
  }
}
