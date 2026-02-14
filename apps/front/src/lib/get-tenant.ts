import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveTenantBySlug, resolveTenantByDomain, type TenantSite } from "./tenant";

export async function getTenant(): Promise<TenantSite> {
  const headersList = await headers();
  const slug = headersList.get("x-tenant-slug");
  const customDomain = headersList.get("x-custom-domain");

  let site: TenantSite | null = null;

  if (slug) {
    site = await resolveTenantBySlug(slug);
  } else if (customDomain) {
    site = await resolveTenantByDomain(customDomain);
  }

  if (!site) {
    notFound();
  }

  return site;
}
