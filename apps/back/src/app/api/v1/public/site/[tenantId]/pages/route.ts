import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sitePages } from "@fieldservice/shared/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { handleApiError } from "@/lib/api/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;

    const pages = await db
      .select({
        id: sitePages.id,
        slug: sitePages.slug,
        title: sitePages.title,
        isHomepage: sitePages.isHomepage,
        seo: sitePages.seo,
        showInNav: sitePages.showInNav,
        navLabel: sitePages.navLabel,
        sortOrder: sitePages.sortOrder,
      })
      .from(sitePages)
      .where(and(eq(sitePages.tenantId, tenantId), eq(sitePages.status, "published")))
      .orderBy(asc(sitePages.sortOrder));

    return NextResponse.json({ data: pages }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
