import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { CreateAgreementForm } from "./create-agreement-form";
import { listCustomers } from "@/lib/services/customers";

export const metadata: Metadata = { title: "New Agreement" };

export default async function NewAgreementPage() {
  const ctx = await requireAuth();
  const { data: customers } = await listCustomers(ctx, { pageSize: 100 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Agreement"
        breadcrumbs={[
          { label: "Agreements", href: "/agreements" },
          { label: "New Agreement" },
        ]}
      />
      <CreateAgreementForm customers={customers} />
    </div>
  );
}
