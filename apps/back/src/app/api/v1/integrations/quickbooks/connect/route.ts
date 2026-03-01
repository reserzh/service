import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { getAuthorizationUrl } from "@/lib/quickbooks/oauth";
import { handleApiError } from "@/lib/api/errors";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    assertPermission(ctx, "integrations", "manage");

    const { url, state } = getAuthorizationUrl(ctx.tenantId);

    // Set CSRF state cookie and redirect to Intuit
    const response = NextResponse.redirect(url);
    response.cookies.set("qb_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
