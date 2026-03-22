import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { CreateCustomerForm } from "./create-customer-form";

export const metadata: Metadata = { title: "New Customer" };

export default async function NewCustomerPage() {
  await requireAuth();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="New Customer"
        description="Add a new customer to your account"
        breadcrumbs={[
          { label: "Customers", href: "/customers" },
          { label: "New Customer" },
        ]}
      />

      <CreateCustomerForm />
    </div>
  );
}
