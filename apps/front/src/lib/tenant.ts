import { cache } from "react";
import { db } from "./db";
import {
  siteSettings,
  siteDomains,
  sitePages,
  tenants,
} from "@fieldservice/shared/db/schema";
import { eq, and, asc } from "drizzle-orm";

export type TenantSite = {
  tenantId: string;
  isPublished: boolean;
  subdomainSlug: string;
  theme: Record<string, unknown> | null;
  branding: Record<string, unknown> | null;
  seoDefaults: Record<string, unknown> | null;
  socialLinks: Record<string, unknown> | null;
  analytics: Record<string, unknown> | null;
  customCss: string | null;
  companyName: string;
};

// Simple in-memory LRU cache for tenant lookups
const tenantCache = new Map<string, { data: TenantSite | null; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key: string): TenantSite | null | undefined {
  const entry = tenantCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    tenantCache.delete(key);
    return undefined;
  }
  return entry.data;
}

function setCache(key: string, data: TenantSite | null) {
  // Evict old entries if cache grows too large
  if (tenantCache.size > 500) {
    const firstKey = tenantCache.keys().next().value;
    if (firstKey) tenantCache.delete(firstKey);
  }
  tenantCache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

export async function resolveTenantBySlug(slug: string): Promise<TenantSite | null> {
  const cacheKey = `slug:${slug}`;
  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;

  const [result] = await db
    .select({
      tenantId: siteSettings.tenantId,
      isPublished: siteSettings.isPublished,
      subdomainSlug: siteSettings.subdomainSlug,
      theme: siteSettings.theme,
      branding: siteSettings.branding,
      seoDefaults: siteSettings.seoDefaults,
      socialLinks: siteSettings.socialLinks,
      analytics: siteSettings.analytics,
      customCss: siteSettings.customCss,
      companyName: tenants.name,
    })
    .from(siteSettings)
    .innerJoin(tenants, eq(siteSettings.tenantId, tenants.id))
    .where(eq(siteSettings.subdomainSlug, slug))
    .limit(1);

  const data = result ?? null;
  setCache(cacheKey, data);
  return data;
}

export async function resolveTenantByDomain(domain: string): Promise<TenantSite | null> {
  const cacheKey = `domain:${domain}`;
  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached;

  const [domainRecord] = await db
    .select({ tenantId: siteDomains.tenantId })
    .from(siteDomains)
    .where(and(eq(siteDomains.domain, domain), eq(siteDomains.status, "active")))
    .limit(1);

  if (!domainRecord) {
    setCache(cacheKey, null);
    return null;
  }

  const [result] = await db
    .select({
      tenantId: siteSettings.tenantId,
      isPublished: siteSettings.isPublished,
      subdomainSlug: siteSettings.subdomainSlug,
      theme: siteSettings.theme,
      branding: siteSettings.branding,
      seoDefaults: siteSettings.seoDefaults,
      socialLinks: siteSettings.socialLinks,
      analytics: siteSettings.analytics,
      customCss: siteSettings.customCss,
      companyName: tenants.name,
    })
    .from(siteSettings)
    .innerJoin(tenants, eq(siteSettings.tenantId, tenants.id))
    .where(eq(siteSettings.tenantId, domainRecord.tenantId))
    .limit(1);

  const data = result ?? null;
  setCache(cacheKey, data);
  return data;
}

export const getNavPages = cache(async (tenantId: string) => {
  return db
    .select({
      id: sitePages.id,
      slug: sitePages.slug,
      title: sitePages.title,
      navLabel: sitePages.navLabel,
      isHomepage: sitePages.isHomepage,
    })
    .from(sitePages)
    .where(
      and(
        eq(sitePages.tenantId, tenantId),
        eq(sitePages.status, "published"),
        eq(sitePages.showInNav, true)
      )
    )
    .orderBy(asc(sitePages.sortOrder));
});
