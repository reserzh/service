import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { getEstimateWithRelations } from "@/lib/services/estimates";
import { notFound } from "next/navigation";
import { EstimateDetailContent } from "./estimate-detail-content";

export const metadata: Metadata = { title: "Estimate Detail" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EstimateDetailPage({ params }: PageProps) {
  const ctx = await requireAuth();
  const { id } = await params;

  let estimate;
  try {
    estimate = await getEstimateWithRelations(ctx, id);
  } catch {
    notFound();
  }

  return <EstimateDetailContent estimate={estimate} />;
}
