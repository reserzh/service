import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { changeJobStatus } from "@/lib/services/jobs";
import { handleApiError } from "@/lib/api/errors";

const statusSchema = z.object({
  status: z.enum(["new", "scheduled", "dispatched", "in_progress", "completed", "canceled"]),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    const body = await req.json();
    const { status } = statusSchema.parse(body);
    const job = await changeJobStatus(ctx, id, status);
    return NextResponse.json({ data: job });
  } catch (error) {
    return handleApiError(error);
  }
}
