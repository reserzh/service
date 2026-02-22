import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getTemplate } from "@/lib/services/communications";
import { PageHeader } from "@/components/layout/page-header";
import { EditTemplateForm } from "./edit-template-form";

export const metadata: Metadata = { title: "Edit Template" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTemplatePage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await requireAuth();

  let template;
  try {
    template = await getTemplate(ctx, id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={template.name}
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Notifications", href: "/settings/notifications" },
          { label: template.name },
        ]}
      />
      <EditTemplateForm template={template} />
    </div>
  );
}
