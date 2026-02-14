import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { convertToJob } from "@/lib/services/bookings";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await params;
    const result = await convertToJob(ctx, id);
    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
