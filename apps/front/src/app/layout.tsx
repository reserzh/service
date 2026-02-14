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

  const cssVars: Record<string, string> = {};
  if (theme.primaryColor) cssVars["--color-primary"] = theme.primaryColor;
  if (theme.secondaryColor) cssVars["--color-secondary"] = theme.secondaryColor;
  if (theme.accentColor) cssVars["--color-accent"] = theme.accentColor;
  if (theme.fontHeading) cssVars["--font-heading"] = `"${theme.fontHeading}", system-ui, sans-serif`;
  if (theme.fontBody) cssVars["--font-body"] = `"${theme.fontBody}", system-ui, sans-serif`;
  if (theme.borderRadius) cssVars["--radius"] = theme.borderRadius;

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
        {site?.customCss && <style dangerouslySetInnerHTML={{ __html: site.customCss }} />}
      </body>
    </html>
  );
}
