import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getCompanyEquipmentItem } from "@/lib/services/company-equipment";
import { listTeamMembers } from "@/lib/services/team";
import { PageHeader } from "@/components/layout/page-header";
import { EquipmentForm } from "../../equipment-form";

export const metadata: Metadata = { title: "Edit Equipment" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEquipmentPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await requireAuth();

  let item;
  try {
    item = await getCompanyEquipmentItem(ctx, id);
  } catch {
    notFound();
  }

  const teamResult = await listTeamMembers(ctx, { pageSize: 100 });
  const teamMembers = teamResult.data.map((m) => ({
    id: m.id,
    name: `${m.firstName} ${m.lastName}`,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${item.name}`}
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Equipment", href: "/settings/equipment" },
          { label: item.name, href: `/settings/equipment/${item.id}` },
          { label: "Edit" },
        ]}
      />
      <EquipmentForm teamMembers={teamMembers} item={item} />
    </div>
  );
}
