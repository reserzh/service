import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getChecklistTemplate, updateChecklistTemplate, deleteChecklistTemplate } from "@/lib/services/checklist-templates";
import { getActionErrorMessage } from "@/lib/api/errors";
import { PageHeader } from "@/components/layout/page-header";
import { ChecklistTemplateForm } from "../checklist-template-form";

export const metadata: Metadata = { title: "Edit Checklist Template" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditChecklistTemplatePage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await requireAuth();

  let template;
  try {
    template = await getChecklistTemplate(ctx, id);
  } catch {
    notFound();
  }

  async function saveAction(data: {
    name: string;
    description?: string;
    jobType?: string;
    isActive?: boolean;
    autoApplyOnDispatch?: boolean;
    items: { label: string; groupName?: string }[];
  }): Promise<{ error?: string }> {
    "use server";
    try {
      const ctx = await requireAuth();
      await updateChecklistTemplate(ctx, id, data);
      return {};
    } catch (error) {
      return { error: getActionErrorMessage(error, "Failed to update template.") };
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={template.name}
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Checklists", href: "/settings/checklists" },
          { label: "Edit" },
        ]}
      />
      <ChecklistTemplateForm template={template} saveAction={saveAction} />
    </div>
  );
}
