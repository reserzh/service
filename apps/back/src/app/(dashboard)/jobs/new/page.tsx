import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { listCustomers } from "@/lib/services/customers";
import { getTechnicians } from "@/lib/services/jobs";
import { PageHeader } from "@/components/layout/page-header";
import { CreateJobForm } from "./create-job-form";

export const metadata: Metadata = { title: "New Job" };

export default async function NewJobPage() {
  const ctx = await requireAuth();

  const [customersResult, technicians] = await Promise.all([
    listCustomers(ctx, { pageSize: 500, sort: "name", order: "asc" }),
    getTechnicians(ctx),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="New Job"
        description="Create a new work order"
        breadcrumbs={[
          { label: "Jobs", href: "/jobs" },
          { label: "New Job" },
        ]}
      />

      <CreateJobForm
        customers={customersResult.data.map((c) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
          phone: c.phone,
        }))}
        technicians={technicians.map((t) => ({
          id: t.id,
          name: `${t.firstName} ${t.lastName}`,
          color: t.color,
        }))}
      />
    </div>
  );
}
