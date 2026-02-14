import { db } from "@/lib/db";
import {
  siteSettings,
  sitePages,
  siteSections,
  serviceCatalog,
  tenants,
} from "@fieldservice/shared/db/schema";
import { getTemplate, templates } from "@fieldservice/shared/templates";
import type { StarterTemplate } from "@fieldservice/shared/templates";
import { eq } from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { logActivity } from "./activity";

export async function applyTemplate(ctx: UserContext, templateId: string) {
  assertPermission(ctx, "website", "create");

  const template = getTemplate(templateId);
  if (!template) {
    throw new Error(`Template "${templateId}" not found`);
  }

  // Get tenant slug for subdomain
  const [tenant] = await db
    .select({ slug: tenants.slug })
    .from(tenants)
    .where(eq(tenants.id, ctx.tenantId))
    .limit(1);

  if (!tenant) throw new Error("Tenant not found");

  // Create or update site settings
  const [settings] = await db
    .insert(siteSettings)
    .values({
      tenantId: ctx.tenantId,
      isPublished: false,
      subdomainSlug: tenant.slug,
      theme: template.theme,
      branding: {
        businessName: "",
        tagline: "",
      },
      seoDefaults: {
        title: "",
        description: "",
      },
      templateId: templateId,
    })
    .onConflictDoUpdate({
      target: siteSettings.tenantId,
      set: {
        theme: template.theme,
        templateId: templateId,
        updatedAt: new Date(),
      },
    })
    .returning();

  // Create pages with sections
  for (let pageIndex = 0; pageIndex < template.pages.length; pageIndex++) {
    const templatePage = template.pages[pageIndex];

    const [page] = await db
      .insert(sitePages)
      .values({
        tenantId: ctx.tenantId,
        slug: templatePage.slug,
        title: templatePage.title,
        isHomepage: templatePage.isHomepage ?? false,
        showInNav: templatePage.showInNav ?? true,
        navLabel: templatePage.navLabel,
        sortOrder: pageIndex,
        status: "draft",
      })
      .returning();

    // Create sections for this page
    for (let sectionIndex = 0; sectionIndex < templatePage.sections.length; sectionIndex++) {
      const templateSection = templatePage.sections[sectionIndex];

      await db.insert(siteSections).values({
        tenantId: ctx.tenantId,
        pageId: page.id,
        type: templateSection.type as typeof siteSections.$inferInsert.type,
        content: templateSection.content,
        settings: templateSection.settings ?? {},
        sortOrder: sectionIndex,
        isVisible: true,
      });
    }
  }

  // Create service catalog entries
  for (let i = 0; i < template.services.length; i++) {
    const svc = template.services[i];
    await db.insert(serviceCatalog).values({
      tenantId: ctx.tenantId,
      name: svc.name,
      slug: svc.slug,
      shortDescription: svc.shortDescription,
      description: svc.description,
      icon: svc.icon,
      priceDisplay: svc.priceDisplay,
      isBookable: svc.isBookable,
      estimatedDuration: svc.estimatedDuration,
      sortOrder: i,
      isActive: true,
    });
  }

  await logActivity(ctx, "website", settings.id, "template_applied", { templateId });

  return { settingsId: settings.id, templateId };
}

export function listTemplates(): Pick<StarterTemplate, "id" | "name" | "description">[] {
  return Object.values(templates).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
  }));
}
