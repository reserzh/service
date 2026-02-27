import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { toggleChecklistItem, deleteChecklistItem } from "@/lib/services/jobs";
import { handleApiError, validateUUID } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ id: string; itemId: string }>;
}

const toggleSchema = z.object({
  completed: z.boolean(),
});

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id, itemId } = await context.params;
    validateUUID(id);
    validateUUID(itemId);

    const body = await req.json();
    const parsed = toggleSchema.parse(body);

    const item = await toggleChecklistItem(ctx, id, itemId, parsed.completed);

    return NextResponse.json({ data: item });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id, itemId } = await context.params;
    validateUUID(id);
    validateUUID(itemId);

    await deleteChecklistItem(ctx, id, itemId);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
