import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { listCustomers } from "@/lib/services/customers";
import { PageHeader } from "@/components/layout/page-header";
import { CreateEstimateForm } from "./create-estimate-form";

export const metadata: Metadata = { title: "New Estimate" };

export default async function NewEstimatePage() {
  const ctx = await requireAuth();

  const customersResult = await listCustomers(ctx, { pageSize: 500, sort: "name", order: "asc" });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="New Estimate"
        description="Create a Good / Better / Best proposal"
        breadcrumbs={[
          { label: "Estimates", href: "/estimates" },
          { label: "New Estimate" },
        ]}
      />

      <CreateEstimateForm
        customers={customersResult.data.map((c) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
        }))}
      />
    </div>
  );
}
