import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { getRecentNotifications, getUnreadCount } from "@/lib/services/notifications";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const limit = Math.min(
      Math.max(parseInt(req.nextUrl.searchParams.get("limit") ?? "20"), 1),
      100
    );

    const [items, unreadCount] = await Promise.all([
      getRecentNotifications(ctx, limit),
      getUnreadCount(ctx),
    ]);

    return NextResponse.json({ data: items, meta: { unreadCount } });
  } catch (error) {
    return handleApiError(error);
  }
}
