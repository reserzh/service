import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { exchangeCodeForTokens } from "@/lib/quickbooks/oauth";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    assertPermission(ctx, "integrations", "manage");
    const url = req.nextUrl;

    const code = url.searchParams.get("code");
    const realmId = url.searchParams.get("realmId");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Handle user denial
    if (error) {
      return NextResponse.redirect(
        new URL("/settings/integrations?qb_error=access_denied", req.url)
      );
    }

    if (!code || !realmId || !state) {
      return NextResponse.redirect(
        new URL("/settings/integrations?qb_error=missing_params", req.url)
      );
    }

    // Validate CSRF state
    const storedState = req.cookies.get("qb_oauth_state")?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL("/settings/integrations?qb_error=invalid_state", req.url)
      );
    }

    // Verify the tenant ID in the state matches the authenticated user
    const stateTenantId = state.split(":")[0];
    if (stateTenantId !== ctx.tenantId) {
      return NextResponse.redirect(
        new URL("/settings/integrations?qb_error=tenant_mismatch", req.url)
      );
    }

    await exchangeCodeForTokens(code, realmId, ctx.tenantId, ctx.userId);

    // Clear CSRF cookie and redirect to settings
    const response = NextResponse.redirect(
      new URL("/settings/integrations?qb_connected=true", req.url)
    );
    response.cookies.delete("qb_oauth_state");

    return response;
  } catch (error) {
    console.error("QB OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/settings/integrations?qb_error=exchange_failed", req.url)
    );
  }
}
