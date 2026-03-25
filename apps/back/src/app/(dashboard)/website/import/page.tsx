import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { isAIConfigured } from "@/lib/ai/client";
import { PageHeader } from "@/components/layout/page-header";
import { ImportSiteForm } from "./import-site-form";
import { redirect } from "next/navigation";

export default async function ImportSitePage() {
  const ctx = await requireAuth();

  if (!hasPermission(ctx.role, "website", "create")) {
    redirect("/dashboard");
  }

  if (!isAIConfigured()) {
    redirect("/website");
  }

  return (
    <>
      <PageHeader
        title="Import from Existing Site"
        description="Scan your current website and recreate the content here"
        breadcrumbs={[
          { label: "Website", href: "/website" },
          { label: "Import" },
        ]}
      />
      <ImportSiteForm />
    </>
  );
}
