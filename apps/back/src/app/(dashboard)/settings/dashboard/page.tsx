import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { db } from "@/lib/db";
import { tenants } from "@fieldservice/shared/db/schema";
import { eq } from "drizzle-orm";
import type { TenantSettings } from "@fieldservice/shared/db/schema/tenants";
import { DashboardSettingsForm } from "./dashboard-settings-form";

export const metadata: Metadata = {
  title: "Site Theme – Settings",
};

export default async function DashboardSettingsPage() {
  const ctx = await requireAuth();

  const [tenant] = await db
    .select({ settings: tenants.settings })
    .from(tenants)
    .where(eq(tenants.id, ctx.tenantId))
    .limit(1);

  const settings = (tenant?.settings ?? {}) as TenantSettings;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Theme"
        description="Choose a site-wide theme and toggle widget visibility"
      />
      <DashboardSettingsForm
        currentPreset={settings.dashboardPreset ?? "classic"}
        currentHiddenWidgets={settings.dashboardHiddenWidgets ?? []}
      />
    </div>
  );
}
