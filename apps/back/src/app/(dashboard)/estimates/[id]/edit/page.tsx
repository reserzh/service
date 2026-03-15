import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getEstimateWithRelations } from "@/lib/services/estimates";
import { PageHeader } from "@/components/layout/page-header";
import { EditEstimateForm } from "./edit-estimate-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit Estimate" };

export default async function EditEstimatePage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await requireAuth();

  let estimate;
  try {
    estimate = await getEstimateWithRelations(ctx, id);
  } catch {
    notFound();
  }

  if (estimate.status !== "draft") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${estimate.estimateNumber}`}
        breadcrumbs={[
          { label: "Estimates", href: "/estimates" },
          { label: estimate.estimateNumber, href: `/estimates/${id}` },
          { label: "Edit" },
        ]}
      />
      <EditEstimateForm estimate={estimate} />
    </div>
  );
}
