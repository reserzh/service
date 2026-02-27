import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import {
  getChecklistTemplate,
  updateChecklistTemplate,
  deleteChecklistTemplate,
} from "@/lib/services/checklist-templates";
import { handleApiError, validateUUID } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);

    const template = await getChecklistTemplate(ctx, id);

    return NextResponse.json({ data: template });
  } catch (error) {
    return handleApiError(error);
  }
}

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  jobType: z.string().max(100).nullable().optional(),
  isActive: z.boolean().optional(),
  items: z.array(z.string().min(1).max(500)).optional(),
});

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);

    const body = await req.json();
    const parsed = updateSchema.parse(body);

    const template = await updateChecklistTemplate(ctx, id, parsed);

    return NextResponse.json({ data: template });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);

    await deleteChecklistTemplate(ctx, id);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
