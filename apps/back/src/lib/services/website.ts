"use server";

import { db } from "@/lib/db";
import {
  siteSettings,
  sitePages,
  siteSections,
  siteMedia,
  siteDomains,
  tenants,
} from "@fieldservice/shared/db/schema";
import type {
  SiteTheme,
  SiteBranding,
  SiteSeoDefaults,
  SiteSocialLinks,
  SiteAnalytics,
  PageSeo,
  SectionContent,
  SectionSettings,
} from "@fieldservice/shared/types";
import { eq, and, asc, desc } from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { logActivity } from "./activity";
import { NotFoundError } from "@/lib/api/errors";
import { addDomainToVercel, removeDomainFromVercel } from "./vercel-domains";

// ─── Site Settings ─────────────────────────────────────────────

export async function getSiteSettings(ctx: UserContext) {
  assertPermission(ctx, "website", "read");

  const [settings] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.tenantId, ctx.tenantId))
    .limit(1);

  return settings ?? null;
}

export interface UpdateSiteSettingsInput {
  isPublished?: boolean;
  theme?: SiteTheme;
  branding?: SiteBranding;
  seoDefaults?: SiteSeoDefaults;
  socialLinks?: SiteSocialLinks;
  analytics?: SiteAnalytics;
  customCss?: string | null;
  templateId?: string;
}

export async function updateSiteSettings(ctx: UserContext, input: UpdateSiteSettingsInput) {
  assertPermission(ctx, "website", "update");

  const existing = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.tenantId, ctx.tenantId))
    .limit(1);

  if (existing.length === 0) {
    // Get tenant slug for subdomain
    const [tenant] = await db
      .select({ slug: tenants.slug })
      .from(tenants)
      .where(eq(tenants.id, ctx.tenantId))
      .limit(1);

    const [created] = await db
      .insert(siteSettings)
      .values({
        tenantId: ctx.tenantId,
        subdomainSlug: tenant?.slug ?? ctx.tenantId,
        ...input,
      })
      .returning();

    await logActivity(ctx, "website", created.id, "site_settings_created");
    return created;
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.isPublished !== undefined) updateData.isPublished = input.isPublished;
  if (input.theme !== undefined) updateData.theme = input.theme;
  if (input.branding !== undefined) updateData.branding = input.branding;
  if (input.seoDefaults !== undefined) updateData.seoDefaults = input.seoDefaults;
  if (input.socialLinks !== undefined) updateData.socialLinks = input.socialLinks;
  if (input.analytics !== undefined) updateData.analytics = input.analytics;
  if (input.customCss !== undefined) updateData.customCss = input.customCss;
  if (input.templateId !== undefined) updateData.templateId = input.templateId;

  const [updated] = await db
    .update(siteSettings)
    .set(updateData)
    .where(eq(siteSettings.tenantId, ctx.tenantId))
    .returning();

  await logActivity(ctx, "website", updated.id, "site_settings_updated");
  return updated;
}

// ─── Pages ─────────────────────────────────────────────────────

export async function listPages(ctx: UserContext) {
  assertPermission(ctx, "website", "read");

  return db
    .select()
    .from(sitePages)
    .where(eq(sitePages.tenantId, ctx.tenantId))
    .orderBy(asc(sitePages.sortOrder));
}

export async function getPage(ctx: UserContext, pageId: string) {
  assertPermission(ctx, "website", "read");

  const [page] = await db
    .select()
    .from(sitePages)
    .where(and(eq(sitePages.id, pageId), eq(sitePages.tenantId, ctx.tenantId)))
    .limit(1);

  if (!page) throw new NotFoundError("Page");
  return page;
}

export interface CreatePageInput {
  slug: string;
  title: string;
  isHomepage?: boolean;
  seo?: PageSeo;
  sortOrder?: number;
  showInNav?: boolean;
  navLabel?: string;
}

export async function createPage(ctx: UserContext, input: CreatePageInput) {
  assertPermission(ctx, "website", "create");

  // If this is set as homepage, unset any existing homepage
  if (input.isHomepage) {
    await db
      .update(sitePages)
      .set({ isHomepage: false, updatedAt: new Date() })
      .where(and(eq(sitePages.tenantId, ctx.tenantId), eq(sitePages.isHomepage, true)));
  }

  const [page] = await db
    .insert(sitePages)
    .values({
      tenantId: ctx.tenantId,
      slug: input.slug,
      title: input.title,
      isHomepage: input.isHomepage ?? false,
      seo: input.seo,
      sortOrder: input.sortOrder ?? 0,
      showInNav: input.showInNav ?? true,
      navLabel: input.navLabel,
    })
    .returning();

  await logActivity(ctx, "website", page.id, "page_created", { title: input.title });
  return page;
}

export interface UpdatePageInput {
  id: string;
  slug?: string;
  title?: string;
  status?: "draft" | "published" | "archived";
  isHomepage?: boolean;
  seo?: PageSeo;
  sortOrder?: number;
  showInNav?: boolean;
  navLabel?: string | null;
}

export async function updatePage(ctx: UserContext, input: UpdatePageInput) {
  assertPermission(ctx, "website", "update");

  if (input.isHomepage) {
    await db
      .update(sitePages)
      .set({ isHomepage: false, updatedAt: new Date() })
      .where(and(eq(sitePages.tenantId, ctx.tenantId), eq(sitePages.isHomepage, true)));
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.slug !== undefined) updateData.slug = input.slug;
  if (input.title !== undefined) updateData.title = input.title;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.isHomepage !== undefined) updateData.isHomepage = input.isHomepage;
  if (input.seo !== undefined) updateData.seo = input.seo;
  if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;
  if (input.showInNav !== undefined) updateData.showInNav = input.showInNav;
  if (input.navLabel !== undefined) updateData.navLabel = input.navLabel;

  const [updated] = await db
    .update(sitePages)
    .set(updateData)
    .where(and(eq(sitePages.id, input.id), eq(sitePages.tenantId, ctx.tenantId)))
    .returning();

  if (!updated) throw new NotFoundError("Page");

  await logActivity(ctx, "website", updated.id, "page_updated");
  return updated;
}

export async function publishPage(ctx: UserContext, pageId: string) {
  assertPermission(ctx, "website", "update");

  const [updated] = await db
    .update(sitePages)
    .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(sitePages.id, pageId), eq(sitePages.tenantId, ctx.tenantId)))
    .returning();

  if (!updated) throw new NotFoundError("Page");

  await logActivity(ctx, "website", updated.id, "page_published");
  return updated;
}

export async function deletePage(ctx: UserContext, pageId: string) {
  assertPermission(ctx, "website", "delete");

  const [deleted] = await db
    .delete(sitePages)
    .where(and(eq(sitePages.id, pageId), eq(sitePages.tenantId, ctx.tenantId)))
    .returning();

  if (!deleted) throw new NotFoundError("Page");

  await logActivity(ctx, "website", deleted.id, "page_deleted", { title: deleted.title });
  return deleted;
}

// ─── Sections ──────────────────────────────────────────────────

export async function listSections(ctx: UserContext, pageId: string) {
  assertPermission(ctx, "website", "read");

  return db
    .select()
    .from(siteSections)
    .where(and(eq(siteSections.tenantId, ctx.tenantId), eq(siteSections.pageId, pageId)))
    .orderBy(asc(siteSections.sortOrder));
}

export interface CreateSectionInput {
  pageId: string;
  type: string;
  content?: SectionContent;
  settings?: SectionSettings;
  sortOrder?: number;
}

export async function createSection(ctx: UserContext, input: CreateSectionInput) {
  assertPermission(ctx, "website", "create");

  // Get max sort order for this page
  const existing = await db
    .select({ sortOrder: siteSections.sortOrder })
    .from(siteSections)
    .where(and(eq(siteSections.tenantId, ctx.tenantId), eq(siteSections.pageId, input.pageId)))
    .orderBy(desc(siteSections.sortOrder))
    .limit(1);

  const nextOrder = input.sortOrder ?? ((existing[0]?.sortOrder ?? -1) + 1);

  const [section] = await db
    .insert(siteSections)
    .values({
      tenantId: ctx.tenantId,
      pageId: input.pageId,
      type: input.type as typeof siteSections.$inferInsert.type,
      content: input.content,
      settings: input.settings,
      sortOrder: nextOrder,
    })
    .returning();

  await logActivity(ctx, "website", section.id, "section_created", { type: input.type });
  return section;
}

export interface UpdateSectionInput {
  content?: SectionContent;
  settings?: SectionSettings;
  isVisible?: boolean;
  sortOrder?: number;
}

export async function updateSection(ctx: UserContext, sectionId: string, input: UpdateSectionInput) {
  assertPermission(ctx, "website", "update");

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.content !== undefined) updateData.content = input.content;
  if (input.settings !== undefined) updateData.settings = input.settings;
  if (input.isVisible !== undefined) updateData.isVisible = input.isVisible;
  if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;

  const [updated] = await db
    .update(siteSections)
    .set(updateData)
    .where(and(eq(siteSections.id, sectionId), eq(siteSections.tenantId, ctx.tenantId)))
    .returning();

  if (!updated) throw new NotFoundError("Section");

  await logActivity(ctx, "website", updated.id, "section_updated");
  return updated;
}

export async function deleteSection(ctx: UserContext, sectionId: string) {
  assertPermission(ctx, "website", "delete");

  const [deleted] = await db
    .delete(siteSections)
    .where(and(eq(siteSections.id, sectionId), eq(siteSections.tenantId, ctx.tenantId)))
    .returning();

  if (!deleted) throw new NotFoundError("Section");

  await logActivity(ctx, "website", deleted.id, "section_deleted");
  return deleted;
}

export async function reorderSections(ctx: UserContext, pageId: string, sectionIds: string[]) {
  assertPermission(ctx, "website", "update");

  const updates = sectionIds.map((id, index) =>
    db
      .update(siteSections)
      .set({ sortOrder: index, updatedAt: new Date() })
      .where(and(eq(siteSections.id, id), eq(siteSections.tenantId, ctx.tenantId), eq(siteSections.pageId, pageId)))
  );

  await Promise.all(updates);

  await logActivity(ctx, "website", pageId, "sections_reordered");
}

// ─── Media ─────────────────────────────────────────────────────

export async function listMedia(ctx: UserContext) {
  assertPermission(ctx, "website", "read");

  return db
    .select()
    .from(siteMedia)
    .where(eq(siteMedia.tenantId, ctx.tenantId))
    .orderBy(desc(siteMedia.createdAt));
}

export interface CreateMediaInput {
  filename: string;
  storagePath: string;
  url: string;
  mimeType?: string;
  sizeBytes?: number;
  altText?: string;
}

export async function createMedia(ctx: UserContext, input: CreateMediaInput) {
  assertPermission(ctx, "website", "create");

  const [media] = await db
    .insert(siteMedia)
    .values({
      tenantId: ctx.tenantId,
      ...input,
    })
    .returning();

  return media;
}

export async function deleteMedia(ctx: UserContext, mediaId: string) {
  assertPermission(ctx, "website", "delete");

  const [deleted] = await db
    .delete(siteMedia)
    .where(and(eq(siteMedia.id, mediaId), eq(siteMedia.tenantId, ctx.tenantId)))
    .returning();

  if (!deleted) throw new NotFoundError("Media");
  return deleted;
}

// ─── Domains ───────────────────────────────────────────────────

export async function listDomains(ctx: UserContext) {
  assertPermission(ctx, "website", "read");

  return db
    .select()
    .from(siteDomains)
    .where(eq(siteDomains.tenantId, ctx.tenantId))
    .orderBy(desc(siteDomains.createdAt));
}

export async function addDomain(ctx: UserContext, domain: string) {
  assertPermission(ctx, "website", "create");

  const token = `fieldservice-verify=${crypto.randomUUID()}`;

  const [created] = await db
    .insert(siteDomains)
    .values({
      tenantId: ctx.tenantId,
      domain: domain.toLowerCase(),
      verificationToken: token,
    })
    .returning();

  // Register with Vercel for automatic SSL
  await addDomainToVercel(domain.toLowerCase());

  await logActivity(ctx, "website", created.id, "domain_added", { domain });
  return created;
}

export async function removeDomain(ctx: UserContext, domainId: string) {
  assertPermission(ctx, "website", "delete");

  const [deleted] = await db
    .delete(siteDomains)
    .where(and(eq(siteDomains.id, domainId), eq(siteDomains.tenantId, ctx.tenantId)))
    .returning();

  if (!deleted) throw new NotFoundError("Domain");

  // Remove from Vercel
  await removeDomainFromVercel(deleted.domain);

  await logActivity(ctx, "website", deleted.id, "domain_removed", { domain: deleted.domain });
  return deleted;
}

export async function verifyDomain(ctx: UserContext, domainId: string) {
  assertPermission(ctx, "website", "update");

  const [domain] = await db
    .select()
    .from(siteDomains)
    .where(and(eq(siteDomains.id, domainId), eq(siteDomains.tenantId, ctx.tenantId)))
    .limit(1);

  if (!domain) throw new NotFoundError("Domain");

  // Attempt DNS TXT record verification
  let verified = false;
  try {
    const { promises: dns } = await import("dns");
    const records = await dns.resolveTxt(domain.domain);
    const flatRecords = records.map((r) => r.join(""));
    verified = flatRecords.some((r) => r === domain.verificationToken);
  } catch {
    // DNS lookup failed — in development, auto-verify
    if (process.env.NODE_ENV === "development") {
      verified = true;
    }
  }

  if (!verified) {
    const [failed] = await db
      .update(siteDomains)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(siteDomains.id, domainId))
      .returning();
    throw new Error(`DNS verification failed for ${failed.domain}. Please ensure the TXT record is set.`);
  }

  const [updated] = await db
    .update(siteDomains)
    .set({
      status: "active",
      verifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(siteDomains.id, domainId))
    .returning();

  await logActivity(ctx, "website", updated.id, "domain_verified", { domain: updated.domain });
  return updated;
}
