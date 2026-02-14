import { getTenant } from "@/lib/get-tenant";
import { getPublishedPage, getPageSections } from "@/lib/queries";
import { SectionRenderer } from "@/components/sections/section-renderer";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const site = await getTenant();
  const page = await getPublishedPage(site.tenantId, slug);

  if (!page) return {};

  const seo = (page.seo ?? {}) as Record<string, string>;
  return {
    title: seo.title || page.title,
    description: seo.description,
  };
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  const site = await getTenant();

  if (!site.isPublished) notFound();

  const page = await getPublishedPage(site.tenantId, slug);
  if (!page) notFound();

  const sections = await getPageSections(site.tenantId, page.id);

  return (
    <>
      {sections.length === 0 ? (
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
        </div>
      ) : (
        sections.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))
      )}
    </>
  );
}
