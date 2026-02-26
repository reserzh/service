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
  Activity,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type { DashboardLayoutProps } from "./types";

export function GlassLayout({ data, hiddenWidgets }: DashboardLayoutProps) {
  const { stats, activity, upcoming, firstName } = data;
  const completionPct = stats.todaysJobs > 0
    ? Math.round((stats.todaysCompleted / stats.todaysJobs) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Good {getGreeting()}, {firstName}</h1>
          <p className="text-sm text-muted-foreground">Command Center</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8" asChild>
            <Link href="/schedule">
              <CalendarDays className="mr-2 h-3.5 w-3.5" />
              Schedule
            </Link>
          </Button>
          <Button size="sm" className="h-8" asChild>
            <Link href="/jobs/new">
              <Plus className="mr-2 h-3.5 w-3.5" />
              New Job
            </Link>
          </Button>
        </div>
      </div>

      {/* Ring Progress + Stats */}
      {!hiddenWidgets.has("stats") && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Ring Progress Card */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card/30 p-5 backdrop-blur-sm">
            <svg viewBox="0 0 100 100" className="h-24 w-24">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="url(#glass-grad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${completionPct * 2.51} 251`}
                transform="rotate(-90 50 50)"
              />
              <defs>
                <linearGradient id="glass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <text x="50" y="47" textAnchor="middle" className="fill-foreground text-xl font-bold" fontSize="18">{completionPct}%</text>
              <text x="50" y="62" textAnchor="middle" className="fill-muted-foreground" fontSize="8">COMPLETE</text>
            </svg>
            <p className="mt-2 text-xs text-muted-foreground">{stats.todaysCompleted}/{stats.todaysJobs} jobs today</p>
          </div>

          <GlassStat
            icon={DollarSign}
            label="Revenue MTD"
            value={formatCurrency(stats.revenueMTD)}
            subtext={`${stats.invoicesPaidMTD} invoices paid`}
            accent="text-emerald-400"
            href="/reports"
          />
          <GlassStat
            icon={FileText}
            label="Open Estimates"
            value={String(stats.openEstimates)}
            subtext={formatCurrency(stats.openEstimatesValue)}
            accent="text-amber-400"
            href="/estimates?status=sent,viewed"
          />
          <GlassStat
            icon={AlertTriangle}
            label="Overdue"
            value={String(stats.overdueInvoices)}
            subtext={formatCurrency(stats.overdueValue)}
            accent={stats.overdueInvoices > 0 ? "text-rose-400" : "text-slate-400"}
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
              <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card/30 p-3 text-center backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card/50 cursor-pointer">
                <a.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground">{a.label}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Schedule */}
        {!hiddenWidgets.has("schedule") && (
          <div className="lg:col-span-3 rounded-xl border border-border bg-card/30 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CalendarDays className="h-4 w-4 text-primary" />
                Today&apos;s Schedule
              </h3>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" asChild>
                <Link href="/schedule" className="text-xs">
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground/40">
                <CalendarDays className="h-8 w-8 mb-2" />
                <p className="text-sm">No jobs scheduled for today.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-card/30 p-3 transition-all hover:bg-card/50 hover:border-primary/20">
                      <div className="text-center min-w-[50px]">
                        {job.scheduledStart ? (
                          <>
                            <p className="text-sm font-semibold text-primary font-mono">
                              {format(new Date(job.scheduledStart), "HH:mm")}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground/40 font-mono">--:--</p>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{job.summary}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground/60 font-mono">{job.jobNumber}</span>
                          <StatusBadge type="job" status={job.status} className="text-[10px] px-1.5 py-0" />
                        </div>
                      </div>
                      {job.assignedFirstName && (
                        <Avatar className="h-6 w-6">
                          <AvatarFallback
                            className="text-[10px] text-white"
                            style={{ backgroundColor: job.assignedColor ?? "#6b7280" }}
                          >
                            {job.assignedFirstName[0]}{job.assignedLastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Right column: Chart + Activity */}
        <div className="lg:col-span-2 space-y-5">
          {!hiddenWidgets.has("chart") && (
            <div className="rounded-xl border border-border bg-card/30 p-4 backdrop-blur-sm">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <Activity className="h-4 w-4 text-cyan-400" />
                Revenue
              </h3>
              {/* Donut Chart */}
              <div className="flex items-center justify-center">
                <svg viewBox="0 0 120 120" className="h-28 w-28">
                  <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="12" />
                  <circle
                    cx="60" cy="60" r="45"
                    fill="none" stroke="#8b5cf6" strokeWidth="12"
                    strokeDasharray={`${(stats.invoicesPaidMTD / Math.max(stats.invoicesPaidMTD + stats.openEstimates, 1)) * 283} 283`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                  <circle
                    cx="60" cy="60" r="45"
                    fill="none" stroke="#06b6d4" strokeWidth="12"
                    strokeDasharray={`${(stats.openEstimates / Math.max(stats.invoicesPaidMTD + stats.openEstimates, 1)) * 283} 283`}
                    strokeDashoffset={`${-(stats.invoicesPaidMTD / Math.max(stats.invoicesPaidMTD + stats.openEstimates, 1)) * 283}`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                  <text x="60" y="57" textAnchor="middle" className="fill-foreground font-bold" fontSize="14">{formatCurrencyShort(stats.revenueMTD)}</text>
                  <text x="60" y="70" textAnchor="middle" className="fill-muted-foreground" fontSize="8">MTD</text>
                </svg>
              </div>
              <div className="mt-3 flex items-center justify-center gap-4 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-violet-500" />
                  <span className="text-muted-foreground">Paid ({stats.invoicesPaidMTD})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  <span className="text-muted-foreground">Pending ({stats.openEstimates})</span>
                </div>
              </div>
            </div>
          )}

          {!hiddenWidgets.has("activity") && (
            <div className="rounded-xl border border-border bg-card/30 p-4 backdrop-blur-sm">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <Clock className="h-4 w-4 text-primary" />
                Activity
              </h3>
              {activity.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground/40">No recent activity.</p>
              ) : (
                <div className="space-y-1">
                  {activity.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-start gap-2 rounded px-1 py-1.5 text-xs">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/50 shrink-0" />
                      <div className="min-w-0">
                        <p className="leading-snug text-foreground/90">
                          <span className="font-medium">{item.userFirstName}</span>{" "}
                          <span className="text-muted-foreground">{formatAction(item.entityType, item.action)}</span>
                        </p>
                        <p className="text-muted-foreground/50">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GlassStat({
  icon: Icon,
  label,
  value,
  subtext,
  accent,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtext: string;
  accent: string;
  href?: string;
}) {
  const inner = (
    <div className="rounded-xl border border-border bg-card/30 p-5 backdrop-blur-sm transition-all hover:bg-card/50 cursor-pointer">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${accent}`} />
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground/60">{subtext}</p>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatCurrencyShort(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount}`;
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
