import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { getQBConnectionStatus } from "@/lib/services/quickbooks";
import { handleApiError } from "@/lib/api/errors";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    assertPermission(ctx, "integrations", "read");

    const status = await getQBConnectionStatus(ctx);
    return NextResponse.json(status);
  } catch (error) {
    return handleApiError(error);
  }
}
