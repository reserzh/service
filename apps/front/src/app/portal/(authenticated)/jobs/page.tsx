import Link from "next/link";
import { requireCustomerAuth } from "@/lib/portal-auth";
import { getPortalJobs } from "@/lib/portal-queries";
import { JOB_STATUS_LABELS } from "@fieldservice/api-types/constants";
import type { JobStatus } from "@fieldservice/api-types/enums";

const statusColors: Record<JobStatus, { bg: string; text: string }> = {
  new: { bg: "bg-gray-100", text: "text-gray-700" },
  scheduled: { bg: "bg-yellow-100", text: "text-yellow-800" },
  dispatched: { bg: "bg-purple-100", text: "text-purple-800" },
  in_progress: { bg: "bg-blue-100", text: "text-blue-800" },
  completed: { bg: "bg-green-100", text: "text-green-800" },
  canceled: { bg: "bg-red-100", text: "text-red-700" },
};

function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PortalJobsPage() {
  const ctx = await requireCustomerAuth();
  const jobs = await getPortalJobs(ctx);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Jobs</h1>

      {jobs.length === 0 ? (
        <p className="mt-6 text-gray-500">No jobs found.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Job Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Summary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Scheduled Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {jobs.map((job) => {
                const status = job.status as JobStatus;
                const colors = statusColors[status] ?? {
                  bg: "bg-gray-100",
                  text: "text-gray-700",
                };
                return (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <Link
                        href={`/portal/jobs/${job.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        #{job.jobNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <Link
                        href={`/portal/jobs/${job.id}`}
                        className="hover:text-blue-600"
                      >
                        {job.summary || "-"}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
                      >
                        {JOB_STATUS_LABELS[status] ?? status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(job.scheduledStart)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
