import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { getInvoiceWithRelations } from "@/lib/services/invoices";
import { notFound } from "next/navigation";
import { InvoiceDetailContent } from "./invoice-detail-content";

export const metadata: Metadata = { title: "Invoice Detail" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const ctx = await requireAuth();
  const { id } = await params;

  let invoice;
  try {
    invoice = await getInvoiceWithRelations(ctx, id);
  } catch {
    notFound();
  }

  return <InvoiceDetailContent invoice={invoice} />;
}
