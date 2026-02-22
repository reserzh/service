import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getPricebookItem } from "@/lib/services/pricebook";
import { PageHeader } from "@/components/layout/page-header";
import { EditPricebookItemForm } from "./edit-pricebook-item-form";

export const metadata: Metadata = { title: "Edit Pricebook Item" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPricebookItemPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await requireAuth();

  let item;
  try {
    item = await getPricebookItem(ctx, id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.name}
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Pricebook", href: "/settings/pricebook" },
          { label: item.name },
        ]}
      />
      <EditPricebookItemForm item={item} />
    </div>
  );
}
