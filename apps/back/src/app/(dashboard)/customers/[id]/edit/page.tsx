import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getCustomer } from "@/lib/services/customers";
import { PageHeader } from "@/components/layout/page-header";
import { EditCustomerForm } from "./edit-customer-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit Customer" };

export default async function EditCustomerPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await requireAuth();

  let customer;
  try {
    customer = await getCustomer(ctx, id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${customer.firstName} ${customer.lastName}`}
        breadcrumbs={[
          { label: "Customers", href: "/customers" },
          { label: `${customer.firstName} ${customer.lastName}`, href: `/customers/${id}` },
          { label: "Edit" },
        ]}
      />
      <EditCustomerForm customer={customer} />
    </div>
  );
}
