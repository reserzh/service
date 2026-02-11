import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { getJobWithRelations, updateJob } from "@/lib/services/jobs";
import { handleApiError } from "@/lib/api/errors";

const updateSchema = z.object({
  jobType: z.string().min(1).max(100).optional(),
  serviceType: z.string().max(100).nullable().optional(),
  summary: z.string().min(1).max(500).optional(),
  description: z.string().nullable().optional(),
  priority: z.enum(["low", "normal", "high", "emergency"]).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  scheduledStart: z.string().nullable().optional(),
  scheduledEnd: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
  customerNotes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    const job = await getJobWithRelations(ctx, id);
    return NextResponse.json({ data: job });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    const body = await req.json();
    const input = updateSchema.parse(body);
    const job = await updateJob(ctx, id, input);
    return NextResponse.json({ data: job });
  } catch (error) {
    return handleApiError(error);
  }
}
