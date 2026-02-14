import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sitePages, siteSections } from "@fieldservice/shared/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { handleApiError } from "@/lib/api/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string; slug: string }> }
) {
  try {
    const { tenantId, slug } = await params;

    const [page] = await db
      .select()
      .from(sitePages)
      .where(
        and(
          eq(sitePages.tenantId, tenantId),
          eq(sitePages.slug, slug),
          eq(sitePages.status, "published")
        )
      )
      .limit(1);

    if (!page) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Page not found" } },
        { status: 404 }
      );
    }

    const sections = await db
      .select()
      .from(siteSections)
      .where(
        and(
          eq(siteSections.tenantId, tenantId),
          eq(siteSections.pageId, page.id),
          eq(siteSections.isVisible, true)
        )
      )
      .orderBy(asc(siteSections.sortOrder));

    return NextResponse.json({
      data: {
        page: {
          id: page.id,
          slug: page.slug,
          title: page.title,
          seo: page.seo,
          isHomepage: page.isHomepage,
        },
        sections: sections.map((s) => ({
          id: s.id,
          type: s.type,
          content: s.content,
          settings: s.settings,
          sortOrder: s.sortOrder,
        })),
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
