import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { getQBConnectionStatus } from "@/lib/services/quickbooks";
import { db } from "@/lib/db";
import { tenants } from "@fieldservice/shared/db/schema";
import { eq } from "drizzle-orm";
import type { TenantSettings } from "@fieldservice/shared/db/schema";
import { QuickBooksConfigForm } from "./config-form";

export const metadata: Metadata = { title: "QuickBooks Configuration" };

export default async function QuickBooksConfigPage() {
  const ctx = await requireAuth();
  if (!hasPermission(ctx.role, "integrations", "manage")) {
    redirect("/settings/integrations");
  }

  const status = await getQBConnectionStatus(ctx);
  if (!status.connected) {
    redirect("/settings/integrations");
  }

  // Get current QB settings
  const [tenant] = await db
    .select({ settings: tenants.settings })
    .from(tenants)
    .where(eq(tenants.id, ctx.tenantId))
    .limit(1);

  const qbSettings = (tenant?.settings as TenantSettings | null)?.quickbooks;

  return (
    <div className="space-y-6">
      <PageHeader
        title="QuickBooks Configuration"
        description={`Connected to ${status.companyName ?? "QuickBooks Online"}`}
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Integrations", href: "/settings/integrations" },
          { label: "QuickBooks" },
        ]}
      />

      <QuickBooksConfigForm
        settings={qbSettings ?? {}}
        stats={status.stats}
      />
    </div>
  );
}
