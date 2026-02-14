import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { listTeamMembers } from "@/lib/services/team";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TeamList } from "./team-list";

export const metadata: Metadata = { title: "Team Members" };

interface PageProps {
  searchParams: Promise<{
    search?: string;
    showInactive?: string;
  }>;
}

export default async function TeamPage({ searchParams }: PageProps) {
  const ctx = await requireAuth();
  const params = await searchParams;

  const result = await listTeamMembers(ctx, {
    search: params.search || undefined,
    includeInactive: params.showInactive === "true",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Members"
        description="Manage your team and their roles"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Team" },
        ]}
      >
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </PageHeader>

      <TeamList
        members={result.data}
        meta={result.meta}
        searchQuery={params.search}
        showInactive={params.showInactive === "true"}
        currentUserId={ctx.userId}
      />
    </div>
  );
}
