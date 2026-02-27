import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { changeJobStatus } from "@/lib/services/jobs";
import { handleApiError, validateUUID } from "@/lib/api/errors";

const statusSchema = z.object({
  status: z.enum(["new", "scheduled", "dispatched", "in_progress", "completed", "canceled"]),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);
    const body = await req.json();
    const { status, latitude, longitude } = statusSchema.parse(body);
    const job = await changeJobStatus(ctx, id, status, { latitude, longitude });
    return NextResponse.json({ data: job });
  } catch (error) {
    return handleApiError(error);
  }
}
