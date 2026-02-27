import { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { listEstimateTemplates } from "@/lib/services/estimate-templates";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileStack } from "lucide-react";

export const metadata: Metadata = { title: "Estimate Templates" };

export default async function EstimateTemplatesPage() {
  const ctx = await requireAuth();
  const { data: templates } = await listEstimateTemplates(ctx);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estimate Templates"
        description="Create reusable estimate templates with preset options and line items"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Estimate Templates" },
        ]}
      >
        <Button asChild>
          <Link href="/settings/estimate-templates/new">
            <Plus className="mr-1.5 h-4 w-4" />
            New Template
          </Link>
        </Button>
      </PageHeader>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileStack className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No estimate templates yet. Create one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <Link key={t.id} href={`/settings/estimate-templates/${t.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between pt-6">
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    {t.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                    )}
                  </div>
                  {!t.isActive && (
                    <Badge variant="secondary" className="text-[10px]">
                      Inactive
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
