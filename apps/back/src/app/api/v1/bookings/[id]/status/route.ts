import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { updateBookingStatus } from "@/lib/services/bookings";

const statusSchema = z.object({
  status: z.enum(["pending", "confirmed", "canceled"]),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await params;
    const body = await req.json();
    const parsed = statusSchema.parse(body);
    const booking = await updateBookingStatus(ctx, id, parsed.status);
    return NextResponse.json({ data: booking });
  } catch (error) {
    return handleApiError(error);
  }
}
