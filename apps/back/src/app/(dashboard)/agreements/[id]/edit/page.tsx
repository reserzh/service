import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getAgreement } from "@/lib/services/agreements";
import { PageHeader } from "@/components/layout/page-header";
import { EditAgreementForm } from "./edit-agreement-form";

export const metadata: Metadata = { title: "Edit Agreement" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAgreementPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await requireAuth();

  let agreement;
  try {
    agreement = await getAgreement(ctx, id);
  } catch {
    notFound();
  }

  if (agreement.status !== "draft") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${agreement.agreementNumber}`}
        breadcrumbs={[
          { label: "Agreements", href: "/agreements" },
          { label: agreement.agreementNumber, href: `/agreements/${agreement.id}` },
          { label: "Edit" },
        ]}
      />
      <EditAgreementForm agreement={agreement} />
    </div>
  );
}
