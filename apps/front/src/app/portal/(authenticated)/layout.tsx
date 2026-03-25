import { requireCustomerAuth } from "@/lib/portal-auth";
import { PortalShell } from "@/components/portal/portal-shell";
import { db } from "@/lib/db";
import { tenants, siteSettings } from "@fieldservice/shared/db/schema";
import { eq } from "drizzle-orm";

export default async function AuthenticatedPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireCustomerAuth();

  const [row] = await db
    .select({
      companyName: tenants.name,
      branding: siteSettings.branding,
    })
    .from(tenants)
    .leftJoin(siteSettings, eq(siteSettings.tenantId, tenants.id))
    .where(eq(tenants.id, ctx.tenantId))
    .limit(1);

  const branding = (row?.branding ?? {}) as Record<string, string>;
  const companyName = branding.businessName || row?.companyName || "Customer Portal";
  const logoUrl = branding.logoUrl || undefined;

  return (
    <PortalShell companyName={companyName} logoUrl={logoUrl}>
      {children}
    </PortalShell>
  );
}
