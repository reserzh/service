import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { verifyDomain } from "@/lib/services/website";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await params;
    const domain = await verifyDomain(ctx, id);
    return NextResponse.json({ data: domain });
  } catch (error) {
    return handleApiError(error);
  }
}
