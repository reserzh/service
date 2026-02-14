import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingSettingsPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Manage your subscription and payment method"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Billing" },
        ]}
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <CreditCard className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">Coming Soon</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Subscription plans, payment methods, and billing history will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
