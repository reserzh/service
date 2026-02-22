import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { listAgreements } from "@/lib/services/agreements";
import { PageHeader } from "@/components/layout/page-header";
import { AgreementList } from "./agreement-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Agreements" };

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}

export default async function AgreementsPage({ searchParams }: PageProps) {
  const ctx = await requireAuth();
  const params = await searchParams;

  const result = await listAgreements(ctx, {
    page: params.page ? parseInt(params.page) : 1,
    search: params.search,
    status: params.status as any,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Agreements" description={`${result.meta.total} agreements`}>
        <Button asChild>
          <Link href="/agreements/new">
            <Plus className="mr-2 h-4 w-4" />
            New Agreement
          </Link>
        </Button>
      </PageHeader>

      <AgreementList
        agreements={result.data}
        meta={result.meta}
        searchQuery={params.search}
        activeStatus={params.status}
      />
    </div>
  );
}
