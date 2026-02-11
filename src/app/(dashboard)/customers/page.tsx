import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { listCustomers } from "@/lib/services/customers";
import { PageHeader } from "@/components/layout/page-header";
import { CustomerList } from "./customer-list";
import { CreateCustomerDialog } from "./create-customer-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Customers",
};

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; type?: string }>;
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const ctx = await requireAuth();
  const params = await searchParams;

  const result = await listCustomers(ctx, {
    page: params.page ? parseInt(params.page) : 1,
    search: params.search,
    type: params.type as "residential" | "commercial" | undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description={`${result.meta.total} customers`}>
        <CreateCustomerDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </CreateCustomerDialog>
      </PageHeader>

      <CustomerList
        customers={result.data}
        meta={result.meta}
        searchQuery={params.search}
      />
    </div>
  );
}
