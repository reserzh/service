import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { listInvoices } from "@/lib/services/invoices";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { InvoiceList } from "./invoice-list";

export const metadata: Metadata = { title: "Invoices" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function InvoicesPage({ searchParams }: PageProps) {
  const ctx = await requireAuth();
  const params = await searchParams;

  const result = await listInvoices(ctx, {
    page: Number(params.page || "1"),
    search: params.search || undefined,
    status: params.status?.split(",") as any || undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="Bill customers and track payments">
        <Link href="/invoices/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </Link>
      </PageHeader>

      <InvoiceList
        invoices={result.data}
        meta={result.meta}
        searchQuery={params.search}
        statusFilter={params.status}
      />
    </div>
  );
}
