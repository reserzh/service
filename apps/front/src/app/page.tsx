import { getTenant } from "@/lib/get-tenant";
import { getHomepage, getPageSections } from "@/lib/queries";
import { SectionRenderer } from "@/components/sections/section-renderer";
import { notFound } from "next/navigation";

export default async function HomePage() {
  const site = await getTenant();

  if (!site.isPublished) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Coming Soon</h1>
          <p className="mt-2 text-gray-600">
            {site.companyName} website is under construction.
          </p>
        </div>
      </div>
    );
  }

  const page = await getHomepage(site.tenantId);
  if (!page) notFound();

  const sections = await getPageSections(site.tenantId, page.id);

  return (
    <>
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </>
  );
}
