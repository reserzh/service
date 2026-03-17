import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { listTeamMembers } from "@/lib/services/team";
import { PageHeader } from "@/components/layout/page-header";
import { EquipmentForm } from "../equipment-form";

export const metadata: Metadata = { title: "New Equipment" };

export default async function NewEquipmentPage() {
  const ctx = await requireAuth();
  const teamResult = await listTeamMembers(ctx, { pageSize: 100 });

  const teamMembers = teamResult.data.map((m) => ({
    id: m.id,
    name: `${m.firstName} ${m.lastName}`,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Equipment"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Equipment", href: "/settings/equipment" },
          { label: "New" },
        ]}
      />
      <EquipmentForm teamMembers={teamMembers} />
    </div>
  );
}
