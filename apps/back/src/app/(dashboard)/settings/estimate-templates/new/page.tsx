import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createEstimateTemplate } from "@/lib/services/estimate-templates";
import { getActionErrorMessage } from "@/lib/api/errors";
import { PageHeader } from "@/components/layout/page-header";
import { EstimateTemplateForm } from "../estimate-template-form";

export const metadata: Metadata = { title: "New Estimate Template" };

export default async function NewEstimateTemplatePage() {
  await requireAuth();

  async function saveAction(data: {
    name: string;
    description?: string;
    summary?: string;
    notes?: string;
    options: {
      name: string;
      description?: string;
      isRecommended?: boolean;
      items: { description: string; quantity: number; unitPrice: number; type?: string }[];
    }[];
  }): Promise<{ error?: string }> {
    "use server";
    try {
      const ctx = await requireAuth();
      await createEstimateTemplate(ctx, {
        ...data,
        options: data.options.map((o) => ({
          ...o,
          items: o.items.map((i) => ({
            ...i,
            type: i.type as "service" | "material" | "labor" | "discount" | "other" | undefined,
          })),
        })),
      });
      return {};
    } catch (error) {
      return { error: getActionErrorMessage(error, "Failed to create template.") };
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Estimate Template"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Estimate Templates", href: "/settings/estimate-templates" },
          { label: "New" },
        ]}
      />
      <EstimateTemplateForm saveAction={saveAction} />
    </div>
  );
}
