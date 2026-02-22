import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import {
  getTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/lib/services/communications";
import { handleApiError, validateUUID } from "@/lib/api/errors";

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  trigger: z.string().max(100).nullable().optional(),
  subject: z.string().min(1).max(500).optional(),
  body: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);
    const template = await getTemplate(ctx, id);
    return NextResponse.json({ data: template });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);
    const body = await req.json();
    const input = updateSchema.parse(body);
    const template = await updateTemplate(ctx, id, input);
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
    await deleteTemplate(ctx, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
