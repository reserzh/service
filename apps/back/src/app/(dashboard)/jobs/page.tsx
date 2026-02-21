import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { listJobs } from "@/lib/services/jobs";
import { PageHeader } from "@/components/layout/page-header";
import { JobList } from "./job-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Jobs" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function JobsPage({ searchParams }: PageProps) {
  const ctx = await requireAuth();
  const params = await searchParams;

  const statusFilter = params.status
    ? (params.status.split(",") as ("new" | "scheduled" | "dispatched" | "in_progress" | "completed" | "canceled")[])
    : undefined;

  const result = await listJobs(ctx, {
    page: params.page ? parseInt(params.page) : 1,
    search: params.search,
    status: statusFilter,
    priority: params.priority as "low" | "normal" | "high" | "emergency" | undefined,
    assignedTo: params.assignedTo,
    from: params.from,
    to: params.to,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Jobs" description={`${result.meta.total} jobs`}>
        <Button asChild>
          <Link href="/jobs/new">
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Link>
        </Button>
      </PageHeader>

      <JobList
        jobs={result.data}
        meta={result.meta}
        searchQuery={params.search}
        statusFilter={params.status}
        priorityFilter={params.priority}
        dateFrom={params.from}
        dateTo={params.to}
      />
    </div>
  );
}
