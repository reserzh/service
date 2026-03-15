import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getInvoiceWithRelations } from "@/lib/services/invoices";
import { PageHeader } from "@/components/layout/page-header";
import { EditInvoiceForm } from "./edit-invoice-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Edit Invoice" };

export default async function EditInvoicePage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await requireAuth();

  let invoice;
  try {
    invoice = await getInvoiceWithRelations(ctx, id);
  } catch {
    notFound();
  }

  if (!["draft", "sent", "viewed"].includes(invoice.status)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${invoice.invoiceNumber}`}
        breadcrumbs={[
          { label: "Invoices", href: "/invoices" },
          { label: invoice.invoiceNumber, href: `/invoices/${id}` },
          { label: "Edit" },
        ]}
      />
      <EditInvoiceForm invoice={invoice} />
    </div>
  );
}
