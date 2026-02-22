import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { listPricebookItems, getPricebookCategories } from "@/lib/services/pricebook";
import { PageHeader } from "@/components/layout/page-header";
import { PricebookList } from "./pricebook-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Pricebook" };

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; category?: string; type?: string }>;
}

export default async function PricebookPage({ searchParams }: PageProps) {
  const ctx = await requireAuth();
  const params = await searchParams;

  const [result, categories] = await Promise.all([
    listPricebookItems(ctx, {
      page: params.page ? parseInt(params.page) : 1,
      search: params.search,
      category: params.category,
      type: params.type as "service" | "material" | "labor" | "discount" | "other" | undefined,
      isActive: true,
    }),
    getPricebookCategories(ctx),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricebook"
        description={`${result.meta.total} items`}
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Pricebook" },
        ]}
      >
        <Button asChild>
          <Link href="/settings/pricebook/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Link>
        </Button>
      </PageHeader>

      <PricebookList
        items={result.data}
        meta={result.meta}
        categories={categories}
        searchQuery={params.search}
        activeCategory={params.category}
        activeType={params.type}
      />
    </div>
  );
}
