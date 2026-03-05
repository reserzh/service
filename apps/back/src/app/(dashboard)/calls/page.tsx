import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { listCalls } from "@/lib/services/calls";
import { PageHeader } from "@/components/layout/page-header";
import { CallList } from "./call-list";
import type { CallDirection, CallStatus } from "@fieldservice/api-types/enums";

export const metadata: Metadata = { title: "Calls" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    direction?: string;
    status?: string;
  }>;
}

export default async function CallsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const ctx = await requireAuth();

  const result = await listCalls(ctx, {
    page: sp.page ? parseInt(sp.page, 10) : 1,
    search: sp.search || undefined,
    direction: (sp.direction as CallDirection) || undefined,
    status: (sp.status as CallStatus) || undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Calls" description="Manage call history and recordings" />
      <CallList
        calls={result.data}
        meta={result.meta}
        initialSearch={sp.search || ""}
        initialDirection={sp.direction || ""}
        initialStatus={sp.status || ""}
      />
    </div>
  );
}
