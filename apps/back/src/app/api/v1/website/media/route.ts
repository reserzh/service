import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { listMedia, deleteMedia } from "@/lib/services/website";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const media = await listMedia(ctx);
    return NextResponse.json({ data: media });
  } catch (error) {
    return handleApiError(error);
  }
}
