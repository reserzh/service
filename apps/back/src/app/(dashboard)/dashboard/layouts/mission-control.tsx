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
  Radio,
  Zap,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type { DashboardLayoutProps } from "./types";

export function MissionControlLayout({ data, hiddenWidgets }: DashboardLayoutProps) {
  const { stats, activity, upcoming, firstName } = data;
  const completionPct = stats.todaysJobs > 0
    ? Math.round((stats.todaysCompleted / stats.todaysJobs) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Alert Ticker */}
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card/80 px-4 py-2.5">
        <Radio className="h-4 w-4 text-primary animate-pulse" />
        <div className="flex-1 overflow-hidden">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-primary">{stats.todaysJobs}</span> jobs today
            {" \u00B7 "}
            <span className="font-semibold text-emerald-400">{stats.todaysCompleted}</span> completed
            {stats.overdueInvoices > 0 && (
              <>
                {" \u00B7 "}
                <span className="font-semibold text-rose-400">{stats.overdueInvoices}</span> overdue invoice{stats.overdueInvoices !== 1 ? "s" : ""}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-7" asChild>
            <Link href="/schedule">Schedule</Link>
          </Button>
          <Button size="sm" className="h-7" asChild>
            <Link href="/jobs/new">
              <Plus className="mr-1 h-3 w-3" />
              New Job
            </Link>
          </Button>
        </div>
      </div>

      {/* Gauge Meters Row */}
      {!hiddenWidgets.has("stats") && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GaugeMeter
            label="Completion"
            value={completionPct}
            max={100}
            unit="%"
            color="cyan"
            subtext={`${stats.todaysCompleted}/${stats.todaysJobs} jobs`}
          />
          <GaugeMeter
            label="Revenue MTD"
            value={stats.revenueMTD}
            max={Math.max(stats.revenueMTD * 1.5, 10000)}
            unit="$"
            color="emerald"
            subtext={`${stats.invoicesPaidMTD} invoices`}
            href="/reports"
          />
          <GaugeMeter
            label="Open Estimates"
            value={stats.openEstimates}
            max={Math.max(stats.openEstimates * 3, 10)}
            unit=""
            color="amber"
            subtext={formatCurrency(stats.openEstimatesValue)}
            href="/estimates?status=sent,viewed"
          />
          <GaugeMeter
            label="Overdue"
            value={stats.overdueInvoices}
            max={Math.max(stats.overdueInvoices * 3, 5)}
            unit=""
            color={stats.overdueInvoices > 0 ? "rose" : "slate"}
            subtext={formatCurrency(stats.overdueValue)}
            href="/invoices?status=overdue"
          />
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
              <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card/60 p-3 text-center transition-all hover:border-primary/30 hover:bg-card cursor-pointer">
                <a.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground">{a.label}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Dispatch Table + Activity */}
      <div className="grid gap-5 lg:grid-cols-5">
        {!hiddenWidgets.has("schedule") && (
          <Card className="lg:col-span-3 border-border bg-card/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base text-foreground">
                  <Zap className="h-4 w-4 text-primary" />
                  Dispatch Table
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" asChild>
                  <Link href="/schedule" className="text-xs">
                    View All <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground/60">
                  <CalendarDays className="h-8 w-8 mb-2" />
                  <p className="text-sm">No dispatches for today.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th className="pb-2 font-medium">ETA</th>
                        <th className="pb-2 font-medium">Job</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Tech</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcoming.map((job) => (
                        <tr key={job.id} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                          <td className="py-2.5 pr-3 text-xs text-primary font-mono whitespace-nowrap">
                            {job.scheduledStart ? format(new Date(job.scheduledStart), "HH:mm") : "--:--"}
                          </td>
                          <td className="py-2.5 pr-3">
                            <Link href={`/jobs/${job.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                              {job.summary}
                            </Link>
                            <p className="text-xs text-muted-foreground/60 font-mono">{job.jobNumber}</p>
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
                                <span className="text-xs text-muted-foreground">{job.assignedFirstName}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground/60">--</span>
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

        {/* Activity + Sparkline placeholder */}
        <div className="lg:col-span-2 space-y-5">
          {!hiddenWidgets.has("chart") && (
            <Card className="border-border bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 h-16">
                  {generateSparkline(stats.revenueMTD).map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-primary/60 transition-all hover:bg-primary"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <p className="mt-2 text-center text-lg font-bold text-primary">{formatCurrency(stats.revenueMTD)}</p>
                <p className="text-center text-[11px] text-muted-foreground">month to date</p>
              </CardContent>
            </Card>
          )}

          {!hiddenWidgets.has("activity") && (
            <Card className="border-border bg-card/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activity.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground/60">No recent activity.</p>
                ) : (
                  <div className="space-y-1">
                    {activity.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-start gap-2 rounded px-1 py-1.5 text-xs">
                        <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                        <div className="min-w-0">
                          <p className="leading-snug text-foreground/80">
                            <span className="font-medium text-foreground">{item.userFirstName}</span>{" "}
                            <span className="text-muted-foreground">{formatAction(item.entityType, item.action)}</span>
                          </p>
                          <p className="text-muted-foreground/60">
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
        </div>
      </div>
    </div>
  );
}

function GaugeMeter({
  label,
  value,
  max,
  unit,
  color,
  subtext,
  href,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: "cyan" | "emerald" | "amber" | "rose" | "slate";
  subtext: string;
  href?: string;
}) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const colorMap = {
    cyan: "bg-cyan-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    slate: "bg-slate-600",
  };
  const textColorMap = {
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
    slate: "text-slate-400",
  };

  const inner = (
    <Card className="border-border bg-card/60 hover:border-border/80 transition-colors cursor-pointer">
      <CardContent className="pt-5 pb-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
        <div className="h-1.5 rounded-full bg-muted mb-2">
          <div className={`h-full rounded-full ${colorMap[color]} transition-all`} style={{ width: `${pct}%` }} />
        </div>
        <p className={`text-xl font-bold font-mono ${textColorMap[color]}`}>
          {unit === "$" ? formatCurrency(value) : `${value}${unit}`}
        </p>
        <p className="text-[11px] text-muted-foreground">{subtext}</p>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

function generateSparkline(seed: number): number[] {
  const bars = 12;
  const result: number[] = [];
  let v = 40;
  for (let i = 0; i < bars; i++) {
    v = Math.max(10, Math.min(100, v + ((((seed * (i + 1) * 7) % 41) - 20))));
    result.push(v);
  }
  return result;
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
