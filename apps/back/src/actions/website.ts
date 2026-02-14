"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import {
  updateSiteSettings,
  createPage,
  updatePage,
  deletePage,
  publishPage,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
} from "@/lib/services/website";
import {
  createService,
  updateService,
  deleteService,
} from "@/lib/services/service-catalog";
import { applyTemplate } from "@/lib/services/template-applicator";

export type WebsiteActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  data?: unknown;
};

// ─── Site Settings ─────────────────────────────────────────────

const siteSettingsSchema = z.object({
  isPublished: z.boolean().optional(),
  theme: z
    .object({
      primaryColor: z.string(),
      secondaryColor: z.string(),
      accentColor: z.string(),
      fontHeading: z.string(),
      fontBody: z.string(),
      borderRadius: z.string(),
      style: z.string(),
    })
    .optional(),
  branding: z
    .object({
      logoUrl: z.string().optional(),
      faviconUrl: z.string().optional(),
      businessName: z.string(),
      tagline: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
    })
    .optional(),
  seoDefaults: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      ogImage: z.string().optional(),
      keywords: z.array(z.string()).optional(),
    })
    .optional(),
  socialLinks: z
    .object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      google: z.string().optional(),
      yelp: z.string().optional(),
      nextdoor: z.string().optional(),
    })
    .optional(),
  analytics: z
    .object({
      googleAnalyticsId: z.string().optional(),
      facebookPixelId: z.string().optional(),
    })
    .optional(),
  customCss: z.string().nullable().optional(),
  templateId: z.string().optional(),
});

export async function updateSiteSettingsAction(
  input: z.infer<typeof siteSettingsSchema>
): Promise<WebsiteActionState> {
  try {
    const ctx = await requireAuth();
    const parsed = siteSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return {
        error: "Invalid input",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const result = await updateSiteSettings(ctx, parsed.data);
    revalidatePath("/website");
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update site settings.";
    return { error: message };
  }
}

// ─── Pages ─────────────────────────────────────────────────────

const createPageSchema = z.object({
  slug: z.string().min(1).max(255),
  title: z.string().min(1).max(255),
  isHomepage: z.boolean().optional(),
  showInNav: z.boolean().optional(),
  navLabel: z.string().max(100).optional(),
  sortOrder: z.number().int().optional(),
});

export async function createPageAction(
  input: z.infer<typeof createPageSchema>
): Promise<WebsiteActionState> {
  try {
    const ctx = await requireAuth();
    const parsed = createPageSchema.safeParse(input);
    if (!parsed.success) {
      return {
        error: "Invalid input",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const result = await createPage(ctx, parsed.data);
    revalidatePath("/website/pages");
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create page.";
    return { error: message };
  }
}

const updatePageSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1).max(255).optional(),
  title: z.string().min(1).max(255).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  isHomepage: z.boolean().optional(),
  showInNav: z.boolean().optional(),
  navLabel: z.string().max(100).nullable().optional(),
  sortOrder: z.number().int().optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      ogImage: z.string().optional(),
      noIndex: z.boolean().optional(),
    })
    .optional(),
});

export async function updatePageAction(
  input: z.infer<typeof updatePageSchema>
): Promise<WebsiteActionState> {
  try {
    const ctx = await requireAuth();
    const parsed = updatePageSchema.safeParse(input);
    if (!parsed.success) {
      return {
        error: "Invalid input",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const result = await updatePage(ctx, parsed.data);
    revalidatePath("/website/pages");
    revalidatePath(`/website/pages/${input.id}`);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update page.";
    return { error: message };
  }
}

export async function publishPageAction(pageId: string): Promise<WebsiteActionState> {
  try {
    const ctx = await requireAuth();
    const result = await publishPage(ctx, pageId);
    revalidatePath("/website/pages");
    revalidatePath(`/website/pages/${pageId}`);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to publish page.";
    return { error: message };
  }
}

export async function deletePageAction(pageId: string): Promise<WebsiteActionState> {
  try {
    const ctx = await requireAuth();
    await deletePage(ctx, pageId);
    revalidatePath("/website/pages");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete page.";
    return { error: message };
  }
}

// ─── Sections ──────────────────────────────────────────────────

const createSectionSchema = z.object({
  pageId: z.string().uuid(),
  type: z.string().min(1),
  content: z.record(z.string(), z.unknown()).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  sortOrder: z.number().int().optional(),
});

export async function createSectionAction(
  input: z.infer<typeof createSectionSchema>
): Promise<WebsiteActionState> {
  try {
    const ctx = await requireAuth();
    const parsed = createSectionSchema.safeParse(input);
    if (!parsed.success) {
      return {
        error: "Invalid input",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const result = await createSection(ctx, parsed.data as Parameters<typeof createSection>[1]);
    revalidatePath(`/website/pages/${input.pageId}`);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create section.";
    return { error: message };
  }
}

const updateSectionSchema = z.object({
  sectionId: z.string().uuid(),
  pageId: z.string().uuid(),
  content: z.record(z.string(), z.unknown()).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function updateSectionAction(
  input: z.infer<typeof updateSectionSchema>
): Promise<WebsiteActionState> {
  try {
    const ctx = await requireAuth();
    const parsed = updateSectionSchema.safeParse(input);
    if (!parsed.success) {
      return {
        error: "Invalid input",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { sectionId, pageId, ...data } = parsed.data;
    const result = await updateSection(ctx, sectionId, data as Parameters<typeof updateSection>[2]);
    revalidatePath(`/website/pages/${pageId}`);
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update section.";
    return { error: message };
  }
}

export async function deleteSectionAction(
  sectionId: string,
  pageId: string
): Promise<WebsiteActionState> {
  try {
    const ctx = await requireAuth();
    await deleteSection(ctx, sectionId);
    revalidatePath(`/website/pages/${pageId}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete section.";
    return { error: message };
  }
}

export async function reorderSectionsAction(
  pageId: string,
  sectionIds: string[]
): Promise<WebsiteActionState> {
  try {
    const ctx = await requireAuth();
    await reorderSections(ctx, pageId, sectionIds);
    revalidatePath(`/website/pages/${pageId}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reorder sections.";
    return { error: message };
  }
}

// ─── Service Catalog ───────────────────────────────────────────

const createServiceSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  imageUrl: z.string().optional(),
  priceDisplay: z.string().max(100).optional(),
  isBookable: z.boolean().optional(),
  estimatedDuration: z.number().int().positive().optional(),
  sortOrder: z.number().int().optional(),
});

export async function createServiceAction(
  input: z.infer<typeof createServiceSchema>
): Promise<WebsiteActionState> {
  try {
    const ctx = await requireAuth();
    const parsed = createServiceSchema.safeParse(input);
    if (!parsed.success) {
      return {
        error: "Invalid input",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const result = await createService(ctx, parsed.data);
    revalidatePath("/website/services");
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create service.";
    return { error: message };
  }
}

const updateServiceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  shortDescription: z.string().max(500).nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  priceDisplay: z.string().max(100).nullable().optional(),
  isBookable: z.boolean().optional(),
  estimatedDuration: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function updateServiceAction(
  input: z.infer<typeof updateServiceSchema>
): Promise<WebsiteActionState> {
  try {
    const ctx = await requireAuth();
    const parsed = updateServiceSchema.safeParse(input);
    if (!parsed.success) {
      return {
        error: "Invalid input",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const result = await updateService(ctx, parsed.data);
    revalidatePath("/website/services");
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update service.";
    return { error: message };
  }
}

export async function deleteServiceAction(serviceId: string): Promise<WebsiteActionState> {
  try {
    const ctx = await requireAuth();
    await deleteService(ctx, serviceId);
    revalidatePath("/website/services");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete service.";
    return { error: message };
  }
}

// ─── Templates ──────────────────────────────────────────────────

export async function applyTemplateAction(templateId: string): Promise<WebsiteActionState> {
  try {
    const ctx = await requireAuth();
    const result = await applyTemplate(ctx, templateId);
    revalidatePath("/website");
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to apply template.";
    return { error: message };
  }
}
