import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { getTenantSettings } from "@/lib/services/settings";
import { PageHeader } from "@/components/layout/page-header";
import { ServicesSettingsForm } from "./services-settings-form";

export const metadata: Metadata = { title: "Services & Pricing" };

export default async function ServicesSettingsPage() {
  const ctx = await requireAuth();
  const settings = await getTenantSettings(ctx);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services & Pricing"
        description="Configure tax rates, business hours, and default terms"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Services" },
        ]}
      />
      <ServicesSettingsForm settings={settings} />
    </div>
  );
}
