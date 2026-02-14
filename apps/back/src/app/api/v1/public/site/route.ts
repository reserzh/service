import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  siteSettings,
  siteDomains,
  sitePages,
  tenants,
} from "@fieldservice/shared/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { handleApiError } from "@/lib/api/errors";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain");
    const slug = searchParams.get("slug");

    if (!domain && !slug) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "domain or slug parameter is required" } },
        { status: 400 }
      );
    }

    let tenantId: string | null = null;

    if (slug) {
      const [tenant] = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.slug, slug))
        .limit(1);
      tenantId = tenant?.id ?? null;
    } else if (domain) {
      // Check custom domains first
      const [customDomain] = await db
        .select({ tenantId: siteDomains.tenantId })
        .from(siteDomains)
        .where(and(eq(siteDomains.domain, domain), eq(siteDomains.status, "active")))
        .limit(1);

      if (customDomain) {
        tenantId = customDomain.tenantId;
      } else {
        // Try subdomain slug
        const [settings] = await db
          .select({ tenantId: siteSettings.tenantId })
          .from(siteSettings)
          .where(eq(siteSettings.subdomainSlug, domain))
          .limit(1);
        tenantId = settings?.tenantId ?? null;
      }
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Site not found" } },
        { status: 404 }
      );
    }

    const [settings] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.tenantId, tenantId))
      .limit(1);

    if (!settings || !settings.isPublished) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Site not found or not published" } },
        { status: 404 }
      );
    }

    // Get published pages for navigation
    const pages = await db
      .select({
        id: sitePages.id,
        slug: sitePages.slug,
        title: sitePages.title,
        isHomepage: sitePages.isHomepage,
        showInNav: sitePages.showInNav,
        navLabel: sitePages.navLabel,
        sortOrder: sitePages.sortOrder,
      })
      .from(sitePages)
      .where(and(eq(sitePages.tenantId, tenantId), eq(sitePages.status, "published")))
      .orderBy(asc(sitePages.sortOrder));

    // Get tenant info for branding
    const [tenant] = await db
      .select({ name: tenants.name, phone: tenants.phone, email: tenants.email })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    return NextResponse.json({
      data: {
        tenantId,
        settings: {
          theme: settings.theme,
          branding: settings.branding,
          seoDefaults: settings.seoDefaults,
          socialLinks: settings.socialLinks,
          analytics: settings.analytics,
          customCss: settings.customCss,
        },
        tenant: tenant ?? null,
        navigation: pages.filter((p) => p.showInNav),
        pages,
      },
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
