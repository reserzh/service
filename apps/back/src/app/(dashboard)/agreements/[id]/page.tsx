import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getAgreementWithRelations } from "@/lib/services/agreements";
import { PageHeader } from "@/components/layout/page-header";
import { AgreementDetailContent } from "./agreement-detail-content";

export const metadata: Metadata = { title: "Agreement Details" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AgreementDetailPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await requireAuth();

  let agreement;
  try {
    agreement = await getAgreementWithRelations(ctx, id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${agreement.agreementNumber} — ${agreement.name}`}
        breadcrumbs={[
          { label: "Agreements", href: "/agreements" },
          { label: agreement.agreementNumber },
        ]}
      />
      <AgreementDetailContent agreement={agreement} />
    </div>
  );
}
