import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { markAllNotificationsRead } from "@/lib/services/notifications";

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    await markAllNotificationsRead(ctx);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
