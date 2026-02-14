import { requireAuth } from "@/lib/auth";
import { listDomains, getSiteSettings } from "@/lib/services/website";
import { PageHeader } from "@/components/layout/page-header";
import { DomainsManager } from "./domains-manager";

export default async function DomainsPage() {
  const ctx = await requireAuth();
  const [domains, settings] = await Promise.all([
    listDomains(ctx),
    getSiteSettings(ctx),
  ]);

  const serializedDomains = domains.map((d) => ({
    ...d,
    verifiedAt: d.verifiedAt ? d.verifiedAt.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));

  return (
    <>
      <PageHeader
        title="Domains"
        description="Manage custom domains for your website"
      />
      <DomainsManager
        initialDomains={serializedDomains}
        subdomainSlug={settings?.subdomainSlug ?? null}
      />
    </>
  );
}
