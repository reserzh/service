import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsSettingsPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Configure email and SMS notification preferences"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Notifications" },
        ]}
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <Bell className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">Coming Soon</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Email and SMS notification preferences will be configurable here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
