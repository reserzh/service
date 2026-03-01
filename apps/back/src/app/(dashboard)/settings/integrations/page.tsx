import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { QuickBooksCard } from "./quickbooks-card";
import { getQBConnectionStatus } from "@/lib/services/quickbooks";

export const metadata: Metadata = { title: "Integrations" };

export default async function IntegrationsSettingsPage() {
  const ctx = await requireAuth();

  let qbStatus: Awaited<ReturnType<typeof getQBConnectionStatus>> | null = null;
  try {
    qbStatus = await getQBConnectionStatus(ctx);
  } catch {
    // QB not configured — show disconnected state
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Connect third-party services to streamline your workflow"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Integrations" },
        ]}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <QuickBooksCard status={qbStatus} />
      </div>
    </div>
  );
}
