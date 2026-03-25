import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { db } from "@/lib/db";
import { tenants, siteSettings } from "@fieldservice/shared/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/v1/branding
 *
 * Returns minimal tenant branding data (logo, name, accent color).
 * Accessible to any authenticated user — no permission check required.
 * Used by the mobile app to apply per-tenant theming.
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);

    const [tenant] = await db
      .select({
        name: tenants.name,
        logoUrl: tenants.logoUrl,
      })
      .from(tenants)
      .where(eq(tenants.id, ctx.tenantId))
      .limit(1);

    const [settings] = await db
      .select({
        theme: siteSettings.theme,
      })
      .from(siteSettings)
      .where(eq(siteSettings.tenantId, ctx.tenantId))
      .limit(1);

    const theme = settings?.theme as
      | { primaryColor?: string; accentColor?: string }
      | null;

    return NextResponse.json({
      data: {
        companyName: tenant?.name ?? "Company",
        logoUrl: tenant?.logoUrl ?? null,
        accentColor: theme?.primaryColor ?? theme?.accentColor ?? null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
