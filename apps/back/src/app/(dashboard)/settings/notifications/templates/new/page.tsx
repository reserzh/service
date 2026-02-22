import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { CreateTemplateForm } from "./create-template-form";

export const metadata: Metadata = { title: "New Template" };

export default async function NewTemplatePage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Email Template"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Notifications", href: "/settings/notifications" },
          { label: "New Template" },
        ]}
      />
      <CreateTemplateForm />
    </div>
  );
}
