import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { listEstimates } from "@/lib/services/estimates";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { EstimateList } from "./estimate-list";

export const metadata: Metadata = { title: "Estimates" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function EstimatesPage({ searchParams }: PageProps) {
  const ctx = await requireAuth();
  const params = await searchParams;

  const result = await listEstimates(ctx, {
    page: Number(params.page || "1"),
    search: params.search || undefined,
    status: params.status?.split(",") as any || undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Estimates" description="Create and track customer proposals">
        <Link href="/estimates/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Estimate
          </Button>
        </Link>
      </PageHeader>

      <EstimateList
        estimates={result.data}
        meta={result.meta}
        searchQuery={params.search}
        statusFilter={params.status}
      />
    </div>
  );
}
