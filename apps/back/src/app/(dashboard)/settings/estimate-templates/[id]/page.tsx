import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getEstimateTemplate, updateEstimateTemplate } from "@/lib/services/estimate-templates";
import { getActionErrorMessage } from "@/lib/api/errors";
import { PageHeader } from "@/components/layout/page-header";
import { EstimateTemplateForm } from "../estimate-template-form";

export const metadata: Metadata = { title: "Edit Estimate Template" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEstimateTemplatePage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await requireAuth();

  let template;
  try {
    template = await getEstimateTemplate(ctx, id);
  } catch {
    notFound();
  }

  async function saveAction(data: {
    name: string;
    description?: string;
    summary?: string;
    notes?: string;
    isActive?: boolean;
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
      await updateEstimateTemplate(ctx, id, {
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
      return { error: getActionErrorMessage(error, "Failed to update template.") };
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={template.name}
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Estimate Templates", href: "/settings/estimate-templates" },
          { label: "Edit" },
        ]}
      />
      <EstimateTemplateForm template={template} saveAction={saveAction} />
    </div>
  );
}
