import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCustomerAuth } from "@/lib/portal-auth";
import { getPortalJob } from "@/lib/portal-queries";
import { db } from "@/lib/db";
import { trackingSessions } from "@fieldservice/shared/db/schema";
import { eq, and } from "drizzle-orm";
import {
  JOB_STATUS_LABELS,
  JOB_PRIORITY_LABELS,
} from "@fieldservice/api-types/constants";
import type { JobStatus, JobPriority } from "@fieldservice/api-types/enums";

const statusColors: Record<JobStatus, { bg: string; text: string }> = {
  new: { bg: "bg-gray-100", text: "text-gray-700" },
  scheduled: { bg: "bg-yellow-100", text: "text-yellow-800" },
  dispatched: { bg: "bg-purple-100", text: "text-purple-800" },
  en_route: { bg: "bg-indigo-100", text: "text-indigo-800" },
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

function formatDateTime(date: Date | string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function PortalJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireCustomerAuth();
  const job = await getPortalJob(ctx, id);

  if (!job) {
    notFound();
  }

  const status = job.status as JobStatus;
  const priority = job.priority as JobPriority;
  const colors = statusColors[status] ?? {
    bg: "bg-gray-100",
    text: "text-gray-700",
  };

  const address = [
    job.propertyAddress,
    job.propertyCity,
    job.propertyState,
    job.propertyZip,
  ]
    .filter(Boolean)
    .join(", ");

  // Check for active tracking session when en_route
  let trackingToken: string | null = null;
  if (status === "en_route") {
    const [activeSession] = await db
      .select({ token: trackingSessions.token })
      .from(trackingSessions)
      .where(
        and(
          eq(trackingSessions.jobId, id),
          eq(trackingSessions.tenantId, ctx.tenantId),
          eq(trackingSessions.status, "active")
        )
      )
      .limit(1);
    trackingToken = activeSession?.token ?? null;
  }

  return (
    <div>
      <Link
        href="/portal/jobs"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to Jobs
      </Link>

      <div className="mt-4 rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Job #{job.jobNumber}</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">
              {job.summary || "Untitled Job"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${colors.bg} ${colors.text}`}
            >
              {JOB_STATUS_LABELS[status] ?? status}
            </span>
            {trackingToken && (
              <a
                href={`/track/${trackingToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-1 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Track Your Technician
              </a>
            )}
          </div>
        </div>

        {job.description && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-500">Description</h2>
            <p className="mt-1 whitespace-pre-wrap text-gray-900">
              {job.description}
            </p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-medium text-gray-500">Priority</h2>
            <p className="mt-1 text-gray-900">
              {JOB_PRIORITY_LABELS[priority] ?? priority}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-gray-500">Job Type</h2>
            <p className="mt-1 text-gray-900">{job.jobType || "-"}</p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-gray-500">
              Scheduled Start
            </h2>
            <p className="mt-1 text-gray-900">
              {formatDateTime(job.scheduledStart)}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-gray-500">
              Scheduled End
            </h2>
            <p className="mt-1 text-gray-900">
              {formatDateTime(job.scheduledEnd)}
            </p>
          </div>

          {job.completedAt && (
            <div>
              <h2 className="text-sm font-medium text-gray-500">
                Completed
              </h2>
              <p className="mt-1 text-gray-900">
                {formatDateTime(job.completedAt)}
              </p>
            </div>
          )}

          {address && (
            <div>
              <h2 className="text-sm font-medium text-gray-500">
                Property Address
              </h2>
              <p className="mt-1 text-gray-900">{address}</p>
            </div>
          )}
        </div>

        {job.customerNotes && (
          <div className="mt-6 rounded-md border border-gray-200 bg-gray-50 p-4">
            <h2 className="text-sm font-medium text-gray-500">
              Customer Notes
            </h2>
            <p className="mt-1 whitespace-pre-wrap text-gray-900">
              {job.customerNotes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
