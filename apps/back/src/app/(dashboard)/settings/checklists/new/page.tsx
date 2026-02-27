import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createChecklistTemplate } from "@/lib/services/checklist-templates";
import { getActionErrorMessage } from "@/lib/api/errors";
import { PageHeader } from "@/components/layout/page-header";
import { ChecklistTemplateForm } from "../checklist-template-form";

export const metadata: Metadata = { title: "New Checklist Template" };

export default async function NewChecklistTemplatePage() {
  await requireAuth();

  async function saveAction(data: {
    name: string;
    description?: string;
    jobType?: string;
    items: string[];
  }): Promise<{ error?: string }> {
    "use server";
    try {
      const ctx = await requireAuth();
      await createChecklistTemplate(ctx, data);
      return {};
    } catch (error) {
      return { error: getActionErrorMessage(error, "Failed to create template.") };
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Checklist Template"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Checklists", href: "/settings/checklists" },
          { label: "New" },
        ]}
      />
      <ChecklistTemplateForm saveAction={saveAction} />
    </div>
  );
}
