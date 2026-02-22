import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { CreatePricebookItemForm } from "./create-pricebook-item-form";

export const metadata: Metadata = { title: "New Pricebook Item" };

export default async function NewPricebookItemPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Pricebook Item"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Pricebook", href: "/settings/pricebook" },
          { label: "New Item" },
        ]}
      />
      <CreatePricebookItemForm />
    </div>
  );
}
