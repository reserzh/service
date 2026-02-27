import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { removeJobAssignment } from "@/lib/services/jobs";
import { handleApiError, validateUUID } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ id: string; userId: string }>;
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id, userId } = await context.params;
    validateUUID(id);
    validateUUID(userId);

    await removeJobAssignment(ctx, id, userId);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
