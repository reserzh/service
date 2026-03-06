import { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { listChecklistTemplates } from "@/lib/services/checklist-templates";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckSquare } from "lucide-react";

export const metadata: Metadata = { title: "Checklist Templates" };

export default async function ChecklistTemplatesPage() {
  const ctx = await requireAuth();
  const { data: templates } = await listChecklistTemplates(ctx);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Checklist Templates"
        description="Create reusable checklists that can be applied to jobs"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Checklists" },
        ]}
      >
        <Button asChild>
          <Link href="/settings/checklists/new">
            <Plus className="mr-1.5 h-4 w-4" />
            New Template
          </Link>
        </Button>
      </PageHeader>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckSquare className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No checklist templates yet. Create one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <Link key={t.id} href={`/settings/checklists/${t.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between pt-6">
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    {t.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                    )}
                    {t.jobType && (
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {t.jobType}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {t.autoApplyOnDispatch && (
                      <Badge variant="default" className="text-[10px]">
                        Auto-apply
                      </Badge>
                    )}
                    {!t.isActive && (
                      <Badge variant="secondary" className="text-[10px]">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
