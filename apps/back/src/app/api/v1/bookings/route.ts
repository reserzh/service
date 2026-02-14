import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { listBookingRequests } from "@/lib/services/bookings";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as "pending" | "confirmed" | "canceled" | null;
    const page = parseInt(searchParams.get("page") ?? "1");
    const pageSize = parseInt(searchParams.get("pageSize") ?? "25");

    const bookings = await listBookingRequests(ctx, {
      status: status ?? undefined,
      page,
      pageSize,
    });

    return NextResponse.json({ data: bookings });
  } catch (error) {
    return handleApiError(error);
  }
}
