import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Link2 } from "lucide-react";

export const metadata: Metadata = { title: "Integrations" };

export default async function IntegrationsSettingsPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Connect third-party services"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Integrations" },
        ]}
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <Link2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">Coming Soon</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Connect QuickBooks, Stripe, and other services to streamline your workflow.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
