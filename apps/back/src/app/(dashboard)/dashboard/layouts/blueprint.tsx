import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Briefcase,
  DollarSign,
  FileText,
  AlertTriangle,
  Clock,
  CalendarDays,
  Users,
  TrendingUp,
  ArrowRight,
  Plus,
  Wrench,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type { DashboardLayoutProps } from "./types";

export function BlueprintLayout({ data, hiddenWidgets }: DashboardLayoutProps) {
  const { stats, activity, upcoming, firstName } = data;
  const completionPct = stats.todaysJobs > 0
    ? Math.round((stats.todaysCompleted / stats.todaysJobs) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Hero Greeting Bar */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-800 via-slate-700 to-blue-900 p-6 text-white">
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="bp-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bp-grid)" />
          </svg>
        </div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Good {getGreeting()}, {firstName}</h1>
            <p className="mt-1 text-sm text-blue-200">Operations overview for today</p>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="secondary" asChild>
              <Link href="/schedule">
                <CalendarDays className="mr-2 h-3.5 w-3.5" />
                Schedule
              </Link>
            </Button>
            <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white" asChild>
              <Link href="/jobs/new">
                <Plus className="mr-2 h-3.5 w-3.5" />
                New Job
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats + Gauge Row */}
      {!hiddenWidgets.has("stats") && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* SVG Gauge */}
          <Card className="lg:row-span-1 border-slate-200">
            <CardContent className="flex flex-col items-center justify-center pt-6">
              <svg viewBox="0 0 120 80" className="h-20 w-28">
                <path d="M 10 70 A 50 50 0 0 1 110 70" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
                <path
                  d="M 10 70 A 50 50 0 0 1 110 70"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${completionPct * 1.57} 157`}
                />
                <text x="60" y="55" textAnchor="middle" className="fill-slate-800 text-xl font-bold" fontSize="20">
                  {completionPct}%
                </text>
                <text x="60" y="72" textAnchor="middle" className="fill-slate-500" fontSize="9">
                  completed
                </text>
              </svg>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.todaysCompleted}/{stats.todaysJobs} jobs
              </p>
            </CardContent>
          </Card>
          <StatTile icon={Briefcase} label="Today's Jobs" value={stats.todaysJobs} color="bg-blue-500" href="/schedule" />
          <StatTile icon={DollarSign} label="Revenue MTD" value={formatCurrency(stats.revenueMTD)} color="bg-emerald-500" href="/reports" />
          <StatTile icon={FileText} label="Open Estimates" value={stats.openEstimates} color="bg-amber-500" href="/estimates?status=sent,viewed" />
          <StatTile icon={AlertTriangle} label="Overdue" value={stats.overdueInvoices} color={stats.overdueInvoices > 0 ? "bg-rose-500" : "bg-slate-400"} href="/invoices?status=overdue" />
        </div>
      )}

      {/* Quick Actions */}
      {!hiddenWidgets.has("quick-actions") && (
        <div className="grid gap-3 grid-cols-5">
          {[
            { href: "/jobs/new", icon: Briefcase, label: "New Job" },
            { href: "/estimates/new", icon: FileText, label: "Estimate" },
            { href: "/invoices/new", icon: DollarSign, label: "Invoice" },
            { href: "/customers/new", icon: Users, label: "Customer" },
            { href: "/dispatch", icon: TrendingUp, label: "Dispatch" },
          ].map((a) => (
            <Link key={a.href} href={a.href}>
              <div className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-3 text-center transition-all hover:border-blue-300 hover:shadow-sm cursor-pointer">
                <div className="rounded-md bg-slate-100 p-2">
                  <a.icon className="h-4 w-4 text-slate-600" />
                </div>
                <span className="text-xs font-medium text-slate-700">{a.label}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Job Queue */}
        {!hiddenWidgets.has("schedule") && (
          <Card className="lg:col-span-2 border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                  <Wrench className="h-4 w-4 text-blue-600" />
                  Job Queue
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/schedule" className="text-xs text-blue-600">
                    View All <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                  <CalendarDays className="h-8 w-8 mb-2" />
                  <p className="text-sm">No jobs queued for today.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-slate-500">
                        <th className="pb-2 font-medium">Time</th>
                        <th className="pb-2 font-medium">Job</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Tech</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcoming.map((job) => (
                        <tr key={job.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-2.5 pr-3 text-xs text-slate-500 whitespace-nowrap">
                            {job.scheduledStart ? format(new Date(job.scheduledStart), "h:mm a") : "TBD"}
                          </td>
                          <td className="py-2.5 pr-3">
                            <Link href={`/jobs/${job.id}`} className="font-medium text-slate-800 hover:text-blue-600 transition-colors">
                              {job.summary}
                            </Link>
                            <p className="text-xs text-slate-400">{job.jobNumber}</p>
                          </td>
                          <td className="py-2.5 pr-3">
                            <StatusBadge type="job" status={job.status} className="text-[10px] px-1.5 py-0" />
                          </td>
                          <td className="py-2.5">
                            {job.assignedFirstName ? (
                              <div className="flex items-center gap-1.5">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback
                                    className="text-[9px] text-white"
                                    style={{ backgroundColor: job.assignedColor ?? "#6b7280" }}
                                  >
                                    {job.assignedFirstName[0]}{job.assignedLastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-slate-600">{job.assignedFirstName}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">Unassigned</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Activity + Team */}
        <div className="space-y-6">
          {!hiddenWidgets.has("activity") && (
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Activity Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activity.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-400">No recent activity.</p>
                ) : (
                  <div className="space-y-1">
                    {activity.slice(0, 6).map((item) => (
                      <div key={item.id} className="flex items-start gap-2 rounded px-1 py-1.5 text-xs">
                        <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="leading-snug text-slate-700">
                            <span className="font-medium">{item.userFirstName}</span>{" "}
                            {formatAction(item.entityType, item.action)}
                          </p>
                          <p className="text-slate-400">
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!hiddenWidgets.has("team") && (
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                  <Users className="h-4 w-4 text-blue-600" />
                  Technician Grid
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcoming.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-400">No techs scheduled today.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {getUniqueTechs(upcoming).map((tech) => (
                      <div key={tech.name} className="flex flex-col items-center rounded-lg border border-slate-100 p-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback
                            className="text-xs text-white"
                            style={{ backgroundColor: tech.color }}
                          >
                            {tech.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="mt-1 text-[10px] font-medium text-slate-600 truncate max-w-full">{tech.name}</span>
                        <span className="text-[10px] text-slate-400">{tech.jobCount} job{tech.jobCount !== 1 ? "s" : ""}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  color,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  href?: string;
}) {
  const tile = (
    <Card className="border-slate-200 hover:shadow-sm transition-shadow cursor-pointer">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{tile}</Link> : tile;
}

function getUniqueTechs(upcoming: DashboardLayoutProps["data"]["upcoming"]) {
  const map = new Map<string, { name: string; initials: string; color: string; jobCount: number }>();
  for (const job of upcoming) {
    if (!job.assignedFirstName) continue;
    const key = job.assignedFirstName + (job.assignedLastName ?? "");
    const existing = map.get(key);
    if (existing) {
      existing.jobCount++;
    } else {
      map.set(key, {
        name: job.assignedFirstName,
        initials: `${job.assignedFirstName[0]}${job.assignedLastName?.[0] ?? ""}`,
        color: job.assignedColor ?? "#6b7280",
        jobCount: 1,
      });
    }
  }
  return Array.from(map.values());
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function formatAction(entityType: string, action: string): string {
  const typeLabels: Record<string, string> = {
    job: "a job", estimate: "an estimate", invoice: "an invoice",
    payment: "a payment", customer: "a customer", user: "a team member", settings: "settings",
  };
  const actionLabels: Record<string, string> = {
    created: "created", updated: "updated", sent: "sent", approved: "approved",
    declined: "declined", voided: "voided", status_changed: "changed status of",
    assigned: "assigned", invited: "invited", deactivated: "deactivated",
    reactivated: "reactivated", recorded: "recorded",
    company_updated: "updated company profile", settings_updated: "updated",
  };
  return `${actionLabels[action] || action} ${typeLabels[entityType] || entityType}`;
}
