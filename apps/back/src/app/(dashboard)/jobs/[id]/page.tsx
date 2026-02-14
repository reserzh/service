import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getJobWithRelations } from "@/lib/services/jobs";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { JobDetailContent } from "./job-detail-content";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Job Details" };
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await requireAuth();

  let job;
  try {
    job = await getJobWithRelations(ctx, id);
  } catch {
    notFound();
  }

  return <JobDetailContent job={job} userRole={ctx.role} />;
}
