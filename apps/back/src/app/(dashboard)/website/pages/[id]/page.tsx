import { requireAuth } from "@/lib/auth";
import { getPage, listSections } from "@/lib/services/website";
import { PageHeader } from "@/components/layout/page-header";
import { PageEditorContent } from "./page-editor-content";
import { notFound } from "next/navigation";

export default async function PageEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireAuth();

  let page;
  try {
    page = await getPage(ctx, id);
  } catch {
    notFound();
  }

  const sections = await listSections(ctx, id);

  return (
    <>
      <PageHeader
        title={`Edit: ${page.title}`}
        description={`/${page.slug}`}
      />
      <PageEditorContent page={page} initialSections={sections} />
    </>
  );
}
