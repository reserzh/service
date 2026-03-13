import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { getTenantSettings } from "@/lib/services/settings";
import { PageHeader } from "@/components/layout/page-header";
import { IndustrySettingsForm } from "./industry-settings-form";

export const metadata: Metadata = { title: "Industry Settings" };

export default async function IndustrySettingsPage() {
  const ctx = await requireAuth();
  const settings = await getTenantSettings(ctx);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Industry Settings"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Industry" },
        ]}
      />
      <IndustrySettingsForm
        tradeType={settings.tradeType}
        operatorType={settings.operatorType}
        landscaping={settings.landscaping}
      />
    </div>
  );
}
