import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError, validateUUID } from "@/lib/api/errors";
import { createDailySnapshot } from "@/lib/services/job-costing";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const snapshotSchema = z.object({
  completionPercent: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);
    const body = await req.json();
    const input = snapshotSchema.parse(body);
    const snapshot = await createDailySnapshot(ctx, id, input);
    return NextResponse.json({ data: snapshot }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
