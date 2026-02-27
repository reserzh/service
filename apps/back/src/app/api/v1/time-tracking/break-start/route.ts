import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { recordClockEvent } from "@/lib/services/time-tracking";
import { handleApiError } from "@/lib/api/errors";

const schema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const body = await req.json().catch(() => ({}));
    const parsed = schema.parse(body);

    const entry = await recordClockEvent(ctx, { ...parsed, type: "break_start" });

    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
