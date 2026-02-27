import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { applyChecklistTemplate } from "@/lib/services/checklist-templates";
import { handleApiError, validateUUID } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const applySchema = z.object({
  templateId: z.string().uuid(),
});

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id: jobId } = await context.params;
    validateUUID(jobId);

    const body = await req.json();
    const parsed = applySchema.parse(body);

    const items = await applyChecklistTemplate(ctx, jobId, parsed.templateId);

    return NextResponse.json({ data: items }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
