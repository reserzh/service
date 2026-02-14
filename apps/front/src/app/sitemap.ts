import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { resolveTenantBySlug, resolveTenantByDomain } from "@/lib/tenant";
import { db } from "@/lib/db";
import { sitePages } from "@fieldservice/shared/db/schema";
import { eq, and } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const slug = headersList.get("x-tenant-slug");
  const customDomain = headersList.get("x-custom-domain");
  const host = headersList.get("host") || "localhost:3001";

  let site;
  if (slug) {
    site = await resolveTenantBySlug(slug);
  } else if (customDomain) {
    site = await resolveTenantByDomain(customDomain);
  }

  if (!site || !site.isPublished) return [];

  const baseUrl = `https://${host}`;

  const pages = await db
    .select({ slug: sitePages.slug, updatedAt: sitePages.updatedAt, isHomepage: sitePages.isHomepage })
    .from(sitePages)
    .where(
      and(
        eq(sitePages.tenantId, site.tenantId),
        eq(sitePages.status, "published")
      )
    );

  const entries: MetadataRoute.Sitemap = [];

  for (const page of pages) {
    entries.push({
      url: page.isHomepage ? baseUrl : `${baseUrl}/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: "weekly",
      priority: page.isHomepage ? 1 : 0.8,
    });
  }

  entries.push({
    url: `${baseUrl}/book`,
    changeFrequency: "monthly",
    priority: 0.9,
  });

  return entries;
}
