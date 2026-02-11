import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { listCustomers } from "@/lib/services/customers";
import { PageHeader } from "@/components/layout/page-header";
import { CreateInvoiceForm } from "./create-invoice-form";

export const metadata: Metadata = { title: "New Invoice" };

export default async function NewInvoicePage() {
  const ctx = await requireAuth();

  const customersResult = await listCustomers(ctx, { pageSize: 500, sort: "name", order: "asc" });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="New Invoice"
        description="Create a new invoice"
        breadcrumbs={[
          { label: "Invoices", href: "/invoices" },
          { label: "New Invoice" },
        ]}
      />

      <CreateInvoiceForm
        customers={customersResult.data.map((c) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
        }))}
      />
    </div>
  );
}
