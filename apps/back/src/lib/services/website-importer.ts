import { getAIClient, AI_MODEL, isAIConfigured } from "@/lib/ai/client";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { createPage, createSection, updateSiteSettings } from "./website";
import { createService } from "./service-catalog";
import { updateCompanyProfile } from "./settings";
import type { SiteTheme } from "@fieldservice/shared/types";
import sanitizeHtml from "sanitize-html";
import { SANITIZE_CONFIG_CUSTOM_HTML } from "@fieldservice/shared/sanitize";
import { validateGeneratedTheme, extractStylesFromUrls, validateExternalUrl } from "./theme-generator";

// ---------- Types ----------

export interface DiscoveredPage {
  url: string;
  title: string;
  path: string;
}

export interface DiscoverResult {
  siteName: string;
  pages: DiscoveredPage[];
}

export interface ImportSection {
  type: string;
  content: Record<string, unknown>;
  include: boolean;
}

export interface ImportPage {
  title: string;
  slug: string;
  isHomepage: boolean;
  sections: ImportSection[];
}

export interface ImportService {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  priceDisplay?: string;
  include: boolean;
}

export interface SiteImportPreview {
  branding: {
    businessName: string;
    tagline?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
  };
  theme: SiteTheme;
  pages: ImportPage[];
  services: ImportService[];
  warnings: string[];
}

export interface ImportResult {
  pagesCreated: number;
  sectionsCreated: number;
  servicesCreated: number;
}

// ---------- Phase 1: Discover Pages ----------

export async function discoverPages(ctx: UserContext, siteUrl: string): Promise<DiscoverResult> {
  assertPermission(ctx, "website", "create");

  // SSRF protection
  await validateExternalUrl(siteUrl);

  const baseUrl = new URL(siteUrl);
  const homepage = await scrapePageContent(siteUrl);

  if (!homepage) {
    throw new Error("Could not access the provided URL");
  }

  // Extract site name from title
  const siteName = homepage.title || baseUrl.hostname;

  // Extract internal links
  const linkRegex = /<a[^>]+href=["']([^"'#]+)["'][^>]*>([^<]*)</gi;
  const pages = new Map<string, DiscoveredPage>();

  // Always include homepage
  pages.set("/", {
    url: siteUrl,
    title: "Home",
    path: "/",
  });

  for (const match of homepage.html.matchAll(linkRegex)) {
    const href = match[1].trim();
    const linkText = match[2].trim();

    if (!href || !linkText) continue;

    let resolvedUrl: URL;
    try {
      resolvedUrl = new URL(href, baseUrl.origin);
    } catch {
      continue;
    }

    // Only same-domain links
    if (resolvedUrl.hostname !== baseUrl.hostname) continue;

    // Skip asset/file links
    const path = resolvedUrl.pathname;
    if (/\.(jpg|jpeg|png|gif|svg|webp|pdf|css|js|ico|xml|txt|woff|woff2|ttf|eot)$/i.test(path)) continue;
    if (path === "/" || path === "") continue;

    // Skip common non-content paths
    if (/^\/(wp-|admin|login|cart|checkout|account|api|feed|tag|category)/i.test(path)) continue;

    if (!pages.has(path)) {
      pages.set(path, {
        url: resolvedUrl.toString(),
        title: linkText.substring(0, 100) || path.replace(/^\//, "").replace(/-/g, " "),
        path,
      });
    }
  }

  return {
    siteName,
    pages: [...pages.values()],
  };
}

// ---------- Phase 2: Analyze Selected Pages ----------

export async function analyzePages(
  ctx: UserContext,
  siteUrl: string,
  selectedPageUrls: string[]
): Promise<SiteImportPreview> {
  assertPermission(ctx, "website", "create");

  if (!isAIConfigured()) {
    throw new Error("AI is not configured");
  }

  // Scrape all selected pages in parallel
  const scrapeResults = await Promise.allSettled(
    selectedPageUrls.map((url) => scrapePageContent(url))
  );

  const warnings: string[] = [];
  const pageContents: Array<{ url: string; title: string; content: string }> = [];

  scrapeResults.forEach((result, i) => {
    if (result.status === "fulfilled" && result.value) {
      pageContents.push({
        url: selectedPageUrls[i],
        title: result.value.title,
        content: result.value.textContent,
      });
    } else {
      warnings.push(`Could not access ${selectedPageUrls[i]}`);
    }
  });

  if (pageContents.length === 0) {
    throw new Error("Could not access any of the selected pages");
  }

  // Also extract style signals from the first page for theme
  const styleExtractions = await extractStylesFromUrls([siteUrl]);

  // Build Claude prompt
  const pagesContext = pageContents
    .map(
      (p, i) =>
        `--- Page ${i + 1}: ${p.title} (${p.url}) ---\n${p.content.substring(0, 5000)}`
    )
    .join("\n\n");

  const styleContext =
    styleExtractions[0]?.styles || "No style information extracted.";

  const prompt = `Analyze the following scraped website content and convert it into a structured site builder format.

SCRAPED PAGES:
${pagesContext}

STYLE INFORMATION:
${styleContext}

Based on the scraped content, produce valid JSON (no markdown fences) matching this schema:

{
  "branding": {
    "businessName": "<extracted business name>",
    "tagline": "<extracted tagline or slogan, if found>",
    "phone": "<phone number if found>",
    "email": "<email if found>",
    "logoUrl": "<logo image URL if found>"
  },
  "theme": {
    "primaryColor": "<hex #RRGGBB based on site's colors>",
    "secondaryColor": "<hex #RRGGBB>",
    "accentColor": "<hex #RRGGBB>",
    "fontHeading": "<one of: Inter, Roboto, Open Sans, Lato, Montserrat, Poppins, Playfair Display, Merriweather>",
    "fontBody": "<one of: Inter, Roboto, Open Sans, Lato, Montserrat, Poppins, Playfair Display, Merriweather>",
    "borderRadius": "<one of: 0, 0.25rem, 0.5rem, 0.75rem, 1rem>",
    "style": "imported"
  },
  "pages": [
    {
      "title": "<page title>",
      "slug": "<url-friendly slug>",
      "isHomepage": true/false,
      "sections": [
        {
          "type": "<section type>",
          "content": { <section-specific content> },
          "include": true
        }
      ]
    }
  ],
  "services": [
    {
      "name": "<service name>",
      "slug": "<url-friendly slug>",
      "description": "<full description>",
      "shortDescription": "<1-2 sentence summary>",
      "priceDisplay": "<price text if found>",
      "include": true
    }
  ]
}

AVAILABLE SECTION TYPES AND THEIR CONTENT SCHEMAS:

1. "hero" — { "heading": string, "subheading"?: string, "ctaText"?: string, "ctaLink"?: string, "backgroundImage"?: string, "alignment"?: "left"|"center" }

2. "about" — { "heading"?: string, "content"?: string, "image"?: string, "layout"?: "left"|"right"|"center" }

3. "services" — { "heading"?: string, "description"?: string, "showPricing"?: boolean, "maxItems"?: number, "layout"?: "grid"|"list" }

4. "testimonials" — { "heading"?: string, "items": [{ "name": string, "text": string, "rating": number, "photo"?: string }] }

5. "faq" — { "heading"?: string, "items": [{ "question": string, "answer": string }] }

6. "gallery" — { "heading"?: string, "images": [{ "url": string, "alt"?: string, "caption"?: string }], "columns"?: number }

7. "contact_form" — { "heading"?: string, "description"?: string, "showMap"?: boolean, "showPhone"?: boolean, "showEmail"?: boolean }

8. "cta_banner" — { "heading": string, "subheading"?: string, "ctaText"?: string, "ctaLink"?: string }

9. "team" — { "heading"?: string, "members": [{ "name": string, "role"?: string, "photo"?: string, "bio"?: string }] }

10. "features" — { "heading"?: string, "description"?: string, "items": [{ "icon"?: string, "title": string, "description": string }], "columns"?: number }

11. "pricing" — { "heading"?: string, "description"?: string, "items": [{ "name": string, "price": string, "description"?: string, "features"?: string[], "highlighted"?: boolean }] }

12. "map" — { "heading"?: string, "address"?: string, "showDirectionsLink"?: boolean }

13. "booking_widget" — { "heading"?: string, "description"?: string, "showServicePicker"?: boolean, "showDatePicker"?: boolean }

14. "custom_html" — { "html": string }

GUIDELINES:
- Create a homepage with a hero section as the first section
- Map content intelligently to the most appropriate section type
- Extract individual items for testimonials, FAQs, team members, services
- Only include sections where you found actual content — don't fabricate content
- Preserve original text as faithfully as possible
- For images, use the original URLs from the scraped content
- If the site is a service business, extract services into the services array
- Keep slugs URL-friendly (lowercase, hyphens, no special chars)
- Set isHomepage to true for the first/main page only`;

  const client = getAIClient();
  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from AI");
  }

  let jsonStr = textBlock.text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  const parsed = JSON.parse(jsonStr) as SiteImportPreview;

  // Validate theme
  parsed.theme = validateGeneratedTheme(
    parsed.theme as unknown as Record<string, string>
  );

  // Ensure required fields
  if (!parsed.branding?.businessName) {
    parsed.branding = {
      ...parsed.branding,
      businessName: new URL(siteUrl).hostname,
    };
  }

  if (!parsed.pages || !Array.isArray(parsed.pages)) {
    parsed.pages = [];
  }

  if (!parsed.services || !Array.isArray(parsed.services)) {
    parsed.services = [];
  }

  parsed.warnings = warnings;

  return parsed;
}

// ---------- Phase 3: Apply Import ----------

export async function applyImport(
  ctx: UserContext,
  preview: SiteImportPreview,
  options: { applyTheme: boolean; applyBranding: boolean }
): Promise<ImportResult> {
  assertPermission(ctx, "website", "create");

  let pagesCreated = 0;
  let sectionsCreated = 0;
  let servicesCreated = 0;

  // Update site settings (theme + branding) if opted in
  if (options.applyTheme || options.applyBranding) {
    const settingsUpdate: {
      theme?: SiteTheme;
      branding?: typeof preview.branding;
    } = {};
    if (options.applyTheme) {
      // Re-validate theme since the client could have tampered with the preview
      settingsUpdate.theme = validateGeneratedTheme(
        preview.theme as unknown as Record<string, string>
      );
    }
    if (options.applyBranding) {
      settingsUpdate.branding = {
        businessName: preview.branding.businessName,
        tagline: preview.branding.tagline,
        phone: preview.branding.phone,
        email: preview.branding.email,
        logoUrl: preview.branding.logoUrl,
      };

      // Also update tenants.logoUrl for mobile app synergy
      if (preview.branding.logoUrl) {
        try {
          await updateCompanyProfile(ctx, {
            logoUrl: preview.branding.logoUrl,
          });
        } catch {
          // Non-critical — mobile logo sync is best-effort
        }
      }
    }
    await updateSiteSettings(ctx, settingsUpdate);
  }

  // Create services
  const includedServices = preview.services.filter((s) => s.include);
  for (let i = 0; i < includedServices.length; i++) {
    const svc = includedServices[i];
    try {
      await createService(ctx, {
        name: svc.name,
        slug: svc.slug || svc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: svc.description,
        shortDescription: svc.shortDescription,
        priceDisplay: svc.priceDisplay,
        sortOrder: i,
      });
      servicesCreated++;
    } catch {
      // Skip duplicate slugs or other errors
    }
  }

  // Create pages and sections
  for (let i = 0; i < preview.pages.length; i++) {
    const page = preview.pages[i];
    try {
      const createdPage = await createPage(ctx, {
        title: page.title,
        slug: page.slug || page.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        isHomepage: page.isHomepage,
        sortOrder: i,
        showInNav: true,
      });

      pagesCreated++;

      // Create sections for this page
      const includedSections = page.sections.filter((s) => s.include);
      for (let j = 0; j < includedSections.length; j++) {
        const section = includedSections[j];
        // Sanitize custom_html sections to prevent XSS
        const content =
          section.type === "custom_html" && section.content.html
            ? { ...section.content, html: sanitizeHtml(String(section.content.html), SANITIZE_CONFIG_CUSTOM_HTML) }
            : section.content;
        try {
          await createSection(ctx, {
            pageId: createdPage.id,
            type: section.type,
            content,
            sortOrder: j,
          });
          sectionsCreated++;
        } catch {
          // Skip invalid sections
        }
      }
    } catch {
      // Skip pages with duplicate slugs
    }
  }

  return { pagesCreated, sectionsCreated, servicesCreated };
}

// ---------- HTML Scraping Utility ----------

interface ScrapeResult {
  html: string;
  title: string;
  textContent: string;
}

async function scrapePageContent(url: string): Promise<ScrapeResult | null> {
  // SSRF protection
  try {
    await validateExternalUrl(url);
  } catch {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; FieldServiceBot/1.0; +https://fieldservicepro.com)",
        Accept: "text/html",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // Extract text content — strip scripts, styles, and HTML tags
    let textContent = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "") // Keep nav for link discovery but strip from content
      .replace(/<footer[\s\S]*?<\/footer>/gi, "[FOOTER]") // Mark footer
      .replace(/<header[\s\S]*?<\/header>/gi, "[HEADER]"); // Mark header

    // Preserve heading hierarchy
    textContent = textContent.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, "\n[H$1] $2\n");
    // Preserve list items
    textContent = textContent.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n");
    // Preserve paragraphs
    textContent = textContent.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n\n");
    // Preserve images (keep src and alt)
    textContent = textContent.replace(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*?)["'][^>]*>/gi, "[IMG: $1 alt=$2]\n");
    textContent = textContent.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, "[IMG: $1]\n");
    // Strip remaining tags
    textContent = textContent.replace(/<[^>]+>/g, " ");
    // Clean whitespace
    textContent = textContent.replace(/\s+/g, " ").replace(/\n\s*\n/g, "\n\n").trim();

    return { html, title, textContent };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
