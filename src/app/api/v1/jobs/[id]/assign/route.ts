import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { assignJob } from "@/lib/services/jobs";
import { handleApiError } from "@/lib/api/errors";

const assignSchema = z.object({
  technicianId: z.string().uuid().nullable(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    const body = await req.json();
    const { technicianId } = assignSchema.parse(body);
    const job = await assignJob(ctx, id, technicianId);
    return NextResponse.json({ data: job });
  } catch (error) {
    return handleApiError(error);
  }
}
