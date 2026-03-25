import type { Metadata } from "next";
import "./globals.css";
import { getTenant } from "@/lib/get-tenant";
import { getNavPages } from "@/lib/tenant";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export async function generateMetadata(): Promise<Metadata> {
  let title = "FieldService Pro";
  let description = "Professional field service website";

  try {
    const site = await getTenant();
    const seo = site.seoDefaults as Record<string, string> | null;
    const branding = site.branding as Record<string, string> | null;
    title = seo?.title || branding?.businessName || site.companyName || title;
    description = seo?.description || description;
  } catch {
    // tenant not found, use defaults
  }

  return { title, description };
}

/** Defense-in-depth: re-sanitize CSS at render time in case DB contains unsanitized values.
 *  Order matters: decode CSS escapes first (normalize), block dangerous patterns, then escape < last. */
function sanitizeCssAtRender(css: string): string {
  // Step 1: Decode CSS escape sequences to normalize obfuscated payloads
  let s = css.replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_m, hex) => String.fromCodePoint(parseInt(hex, 16)));
  s = s.replace(/\\([a-zA-Z(])/g, "$1");
  // Step 2: Block dangerous patterns on the normalized string
  s = s.replace(/@import\b/gi, "/* blocked */");
  s = s.replace(/@charset\b/gi, "/* blocked */");
  s = s.replace(/@font-face\b/gi, "/* blocked */");
  s = s.replace(/@namespace\b/gi, "/* blocked */");
  s = s.replace(/expression\s*\(/gi, "/* blocked */(");
  s = s.replace(/-moz-binding\s*:/gi, "/* blocked */:");
  s = s.replace(/behavior\s*:/gi, "/* blocked */:");
  s = s.replace(/url\s*\(/gi, "/* blocked */(");
  s = s.replace(/@keyframes\b/gi, "/* blocked */");
  // Step 3: Escape < LAST to prevent </style> breakout (must come after decode)
  s = s.replace(/</g, "\\3c ");
  return s;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let site;
  let navPages: Awaited<ReturnType<typeof getNavPages>> = [];

  try {
    site = await getTenant();
    navPages = await getNavPages(site.tenantId);
  } catch {
    // tenant not found — will be handled by page-level notFound()
  }

  const theme = (site?.theme ?? {}) as Record<string, string>;
  const branding = (site?.branding ?? {}) as Record<string, string>;

  // Sanitize CSS values to prevent injection
  const sanitizeFontName = (name: string) => name.replace(/[";{}\\<>()]/g, "");
  const sanitizeColor = (color: string) => /^#[0-9a-fA-F]{3,8}$|^[a-zA-Z]+$/.test(color) ? color : "";
  const sanitizeRadius = (r: string) => /^[\d.]+(px|rem|em|%)$/.test(r) ? r : "";

  const cssVars: Record<string, string> = {};
  if (theme.primaryColor) { const v = sanitizeColor(theme.primaryColor); if (v) cssVars["--color-primary"] = v; }
  if (theme.secondaryColor) { const v = sanitizeColor(theme.secondaryColor); if (v) cssVars["--color-secondary"] = v; }
  if (theme.accentColor) { const v = sanitizeColor(theme.accentColor); if (v) cssVars["--color-accent"] = v; }
  if (theme.fontHeading) cssVars["--font-heading"] = `"${sanitizeFontName(theme.fontHeading)}", system-ui, sans-serif`;
  if (theme.fontBody) cssVars["--font-body"] = `"${sanitizeFontName(theme.fontBody)}", system-ui, sans-serif`;
  if (theme.borderRadius) { const v = sanitizeRadius(theme.borderRadius); if (v) cssVars["--radius"] = v; }

  return (
    <html lang="en" style={cssVars as React.CSSProperties}>
      <body>
        {site && (
          <SiteHeader
            companyName={branding.businessName || site.companyName}
            logoUrl={branding.logoUrl}
            phone={branding.phone}
            navPages={navPages}
          />
        )}
        <main className="min-h-screen">{children}</main>
        {site && (
          <SiteFooter
            companyName={branding.businessName || site.companyName}
            phone={branding.phone}
            email={branding.email}
            socialLinks={site.socialLinks as Record<string, string> | null}
          />
        )}
        {site?.customCss && <style dangerouslySetInnerHTML={{ __html: sanitizeCssAtRender(site.customCss) }} />}
      </body>
    </html>
  );
}
