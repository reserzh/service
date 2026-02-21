import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { markNotificationRead } from "@/lib/services/notifications";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = paramsSchema.parse(await params);
    await markNotificationRead(ctx, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
