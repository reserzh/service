import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { getTimeEntries } from "@/lib/services/time-tracking";
import { handleApiError } from "@/lib/api/errors";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const url = new URL(req.url);

    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "from and to query parameters are required" } },
        { status: 400 }
      );
    }

    const entries = await getTimeEntries(ctx, {
      from,
      to,
      userId: url.searchParams.get("userId") || undefined,
    });

    return NextResponse.json({ data: entries });
  } catch (error) {
    return handleApiError(error);
  }
}
