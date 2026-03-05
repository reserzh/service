import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { getCallRecordings } from "@/lib/services/calls";
import { handleApiError, validateUUID } from "@/lib/api/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await params;
    validateUUID(id);
    const recordings = await getCallRecordings(ctx, id);
    return NextResponse.json({ data: recordings });
  } catch (error) {
    return handleApiError(error);
  }
}
