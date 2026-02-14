import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { getSchedule } from "@/lib/services/jobs";
import { handleApiError } from "@/lib/api/errors";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const url = req.nextUrl;

    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const technicianId = url.searchParams.get("technicianId") || undefined;

    if (!from || !to) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "from and to query parameters are required" } },
        { status: 400 }
      );
    }

    const data = await getSchedule(ctx, from, to, technicianId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
