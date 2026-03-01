import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { listSyncLog } from "@/lib/services/quickbooks";
import { SyncLogTable } from "./sync-log-table";

export const metadata: Metadata = { title: "QuickBooks Sync Log" };

interface Props {
  searchParams: Promise<{
    page?: string;
    entityType?: string;
    status?: string;
  }>;
}

export default async function SyncLogPage({ searchParams }: Props) {
  const ctx = await requireAuth();
  if (!hasPermission(ctx.role, "integrations", "read")) {
    return redirect("/settings/integrations");
  }

  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const result = await listSyncLog(ctx, {
    page,
    pageSize: 25,
    entityType: params.entityType,
    status: params.status,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sync Log"
        description="View QuickBooks sync history and retry failed items"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Integrations", href: "/settings/integrations" },
          { label: "QuickBooks", href: "/settings/integrations/quickbooks" },
          { label: "Sync Log" },
        ]}
      />

      <SyncLogTable
        data={result.data}
        meta={result.meta}
        filters={{
          entityType: params.entityType,
          status: params.status,
        }}
      />
    </div>
  );
}
