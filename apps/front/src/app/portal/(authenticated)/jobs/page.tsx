import { requireCustomerAuth } from "@/lib/portal-auth";
import { getPortalJobs } from "@/lib/portal-queries";
import { PortalJobsView } from "./portal-jobs-view";

export default async function PortalJobsPage() {
  const ctx = await requireCustomerAuth();
  const jobs = await getPortalJobs(ctx);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Jobs</h1>
      <PortalJobsView jobs={jobs} />
    </div>
  );
}
