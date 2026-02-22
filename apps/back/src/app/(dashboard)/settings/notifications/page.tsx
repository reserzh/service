import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { listTemplates } from "@/lib/services/communications";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Plus, FileText } from "lucide-react";
import Link from "next/link";
import { COMMUNICATION_TRIGGER_LABELS } from "@fieldservice/api-types/constants";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsSettingsPage() {
  const ctx = await requireAuth();

  const { data: templates } = await listTemplates(ctx, { pageSize: 50 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Configure email templates and notification preferences"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Notifications" },
        ]}
      >
        <Button asChild>
          <Link href="/settings/notifications/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Link>
        </Button>
      </PageHeader>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Email Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-muted p-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium">No templates yet</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                Create email templates for automatic notifications when invoices are sent, jobs are scheduled, and more.
              </p>
              <Button asChild className="mt-4">
                <Link href="/settings/notifications/templates/new">Create Template</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {templates.map((template) => (
                <Link
                  key={template.id}
                  href={`/settings/notifications/templates/${template.id}`}
                  className="flex items-center justify-between py-3 hover:bg-muted/50 px-2 -mx-2 rounded-md transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.subject}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {template.trigger && (
                      <Badge variant="outline">
                        {COMMUNICATION_TRIGGER_LABELS[template.trigger as keyof typeof COMMUNICATION_TRIGGER_LABELS] || template.trigger}
                      </Badge>
                    )}
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
