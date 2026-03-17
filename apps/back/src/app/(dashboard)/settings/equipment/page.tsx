import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { listCompanyEquipment } from "@/lib/services/company-equipment";
import { PageHeader } from "@/components/layout/page-header";
import { EquipmentList } from "./equipment-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Company Equipment" };

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string }>;
}

export default async function EquipmentPage({ searchParams }: PageProps) {
  const ctx = await requireAuth();
  const params = await searchParams;

  const items = await listCompanyEquipment(ctx, {
    search: params.search,
    status: params.status,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Equipment"
        description={`${items.length} items`}
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Equipment" },
        ]}
      >
        <Button asChild>
          <Link href="/settings/equipment/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Equipment
          </Link>
        </Button>
      </PageHeader>

      <EquipmentList
        items={items}
        searchQuery={params.search}
        activeStatus={params.status}
      />
    </div>
  );
}
