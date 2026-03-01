import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { disconnectCompany } from "@/lib/quickbooks/oauth";
import { handleApiError } from "@/lib/api/errors";

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    assertPermission(ctx, "integrations", "manage");

    await disconnectCompany(ctx.tenantId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
