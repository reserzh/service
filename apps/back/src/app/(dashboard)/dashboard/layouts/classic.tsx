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
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DashboardLayoutProps } from "./types";

export type ClassicVariant = "default" | "executive" | "arctic" | "ocean";

const variants: Record<
  ClassicVariant,
  {
    wrapper: string;
    card: string;
    cardHover: string;
    statIcon: Record<string, string>;
    statValue: Record<string, string>;
    quickAction: string;
    quickActionIcon: string;
    sectionIcon: string;
    dot: string;
    muted: string;
    scheduleItem: string;
    emptyIcon: string;
  }
> = {
  default: {
    wrapper: "",
    card: "",
    cardHover: "hover:shadow-md",
    statIcon: {
      primary: "bg-primary/10 text-primary",
      green: "bg-status-completed/10 text-status-completed",
      blue: "bg-status-scheduled/10 text-status-scheduled",
      red: "bg-status-overdue/10 text-status-overdue",
      default: "bg-muted text-muted-foreground",
    },
    statValue: {
      primary: "",
      green: "text-status-completed",
      blue: "",
      red: "text-status-overdue",
      default: "",
    },
    quickAction: "hover:border-primary/20",
    quickActionIcon: "bg-primary/10 text-primary",
    sectionIcon: "text-primary",
    dot: "bg-primary/40",
    muted: "text-muted-foreground",
    scheduleItem: "hover:bg-muted/50",
    emptyIcon: "text-muted-foreground/40",
  },
  executive: {
    wrapper: "",
    card: "bg-card border-border",
    cardHover: "hover:shadow-md hover:shadow-primary/5 hover:border-border/80",
    statIcon: {
      primary: "bg-primary/15 text-primary",
      green: "bg-emerald-500/15 text-emerald-400",
      blue: "bg-sky-500/15 text-sky-400",
      red: "bg-rose-500/15 text-rose-400",
      default: "bg-muted text-muted-foreground",
    },
    statValue: {
      primary: "text-foreground",
      green: "text-emerald-400",
      blue: "text-foreground",
      red: "text-rose-400",
      default: "text-foreground",
    },
    quickAction: "hover:border-primary/30",
    quickActionIcon: "bg-primary/15 text-primary",
    sectionIcon: "text-primary",
    dot: "bg-primary/50",
    muted: "text-muted-foreground",
    scheduleItem: "hover:bg-accent/60",
    emptyIcon: "text-muted-foreground/40",
  },
  arctic: {
    wrapper: "",
    card: "border-border shadow-none bg-card",
    cardHover: "hover:shadow-sm hover:border-border/80",
    statIcon: {
      primary: "bg-muted text-primary",
      green: "bg-emerald-50 text-emerald-600",
      blue: "bg-sky-50 text-sky-600",
      red: "bg-rose-50 text-rose-600",
      default: "bg-muted text-muted-foreground",
    },
    statValue: {
      primary: "text-foreground",
      green: "text-emerald-700",
      blue: "text-foreground",
      red: "text-rose-700",
      default: "text-foreground",
    },
    quickAction: "hover:border-border/80",
    quickActionIcon: "bg-muted text-muted-foreground",
    sectionIcon: "text-muted-foreground",
    dot: "bg-muted-foreground/30",
    muted: "text-muted-foreground",
    scheduleItem: "hover:bg-muted/50",
    emptyIcon: "text-muted-foreground/30",
  },
  ocean: {
    wrapper: "",
    card: "border-border bg-card",
    cardHover: "hover:shadow-md hover:shadow-primary/10 hover:border-border/80",
    statIcon: {
      primary: "bg-primary/10 text-primary",
      green: "bg-teal-100 text-teal-600",
      blue: "bg-sky-100 text-sky-600",
      red: "bg-rose-100 text-rose-600",
      default: "bg-muted text-muted-foreground",
    },
    statValue: {
      primary: "text-foreground",
      green: "text-teal-700",
      blue: "text-foreground",
      red: "text-rose-700",
      default: "text-foreground",
    },
    quickAction: "hover:border-primary/30",
    quickActionIcon: "bg-primary/10 text-primary",
    sectionIcon: "text-primary",
    dot: "bg-primary/50",
    muted: "text-muted-foreground",
    scheduleItem: "hover:bg-muted/50",
    emptyIcon: "text-muted-foreground/30",
  },
};

export function ClassicLayout({
  data,
  hiddenWidgets,
  variant = "default",
}: DashboardLayoutProps & { variant?: ClassicVariant }) {
  const v = variants[variant];
  const { stats, activity, upcoming, firstName } = data;

  return (
    <div className={cn("space-y-6", v.wrapper)}>
      {/* Stats Grid */}
      {!hiddenWidgets.has("stats") && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Jobs"
            value={String(stats.todaysJobs)}
            subtitle={`${stats.todaysCompleted} completed`}
            icon={Briefcase}
            color="primary"
            href="/schedule"
            v={v}
          />
          <StatCard
            title="Revenue (MTD)"
            value={formatCurrency(stats.revenueMTD)}
            subtitle={`${stats.invoicesPaidMTD} invoices paid`}
            icon={DollarSign}
            color="green"
            href="/reports"
            v={v}
          />
          <StatCard
            title="Open Estimates"
            value={String(stats.openEstimates)}
            subtitle={`${formatCurrency(stats.openEstimatesValue)} pending`}
            icon={FileText}
            color="blue"
            href="/estimates?status=sent,viewed"
            v={v}
          />
          <StatCard
            title="Overdue Invoices"
            value={String(stats.overdueInvoices)}
            subtitle={`${formatCurrency(stats.overdueValue)} outstanding`}
            icon={AlertTriangle}
            color={stats.overdueInvoices > 0 ? "red" : "default"}
            href="/invoices?status=overdue"
            v={v}
          />
        </div>
      )}

      {/* Quick Actions */}
      {!hiddenWidgets.has("quick-actions") && (
        <div className="grid gap-4 lg:grid-cols-5">
          <QuickAction href="/jobs/new" icon={Briefcase} label="New Job" v={v} />
          <QuickAction href="/estimates/new" icon={FileText} label="New Estimate" v={v} />
          <QuickAction href="/invoices/new" icon={DollarSign} label="New Invoice" v={v} />
          <QuickAction href="/customers/new" icon={Users} label="New Customer" v={v} />
          <QuickAction href="/dispatch" icon={TrendingUp} label="Dispatch Board" v={v} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Jobs */}
        {!hiddenWidgets.has("schedule") && (
          <Card className={cn(v.card)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className={cn("h-4 w-4", v.sectionIcon)} />
                  Today&apos;s Schedule
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/schedule" className="text-xs">
                    View All
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CalendarDays className={cn("h-8 w-8 mb-2", v.emptyIcon)} />
                  <p className={cn("text-sm", v.muted)}>No upcoming jobs today.</p>
                  <p className={cn("mt-1 text-xs", v.muted)}>Scheduled jobs will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcoming.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`}>
                      <div className={cn("flex items-center gap-3 rounded-lg border p-3 transition-colors", v.card, v.scheduleItem)}>
                        <div className="text-center min-w-[50px]">
                          {job.scheduledStart ? (
                            <>
                              <p className={cn("text-sm font-semibold", v.sectionIcon)}>
                                {format(new Date(job.scheduledStart), "h:mm")}
                              </p>
                              <p className={cn("text-[10px] uppercase", v.muted)}>
                                {format(new Date(job.scheduledStart), "a")}
                              </p>
                            </>
                          ) : (
                            <p className={cn("text-xs", v.muted)}>TBD</p>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{job.summary}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn("text-xs", v.muted)}>{job.jobNumber}</span>
                            <StatusBadge type="job" status={job.status} className="text-[10px] px-1.5 py-0" />
                          </div>
                        </div>
                        {job.assignedFirstName && (
                          <Avatar className="h-6 w-6">
                            <AvatarFallback
                              className="text-[10px] text-white"
                              style={{ backgroundColor: job.assignedColor ?? "#6b7280" }}
                            >
                              {job.assignedFirstName[0]}
                              {job.assignedLastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {!hiddenWidgets.has("activity") && (
          <Card className={cn(v.card)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className={cn("h-4 w-4", v.sectionIcon)} />
                  Recent Activity
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className={cn("h-8 w-8 mb-2", v.emptyIcon)} />
                  <p className={cn("text-sm", v.muted)}>No recent activity.</p>
                  <p className={cn("mt-1 text-xs", v.muted)}>
                    Jobs, estimates, and invoices will show up here.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {activity.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 rounded-lg px-2 py-2 text-sm">
                      <div className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", v.dot)} />
                      <div className="flex-1 min-w-0">
                        <p className="leading-snug">
                          <span className="font-medium">
                            {item.userFirstName} {item.userLastName}
                          </span>{" "}
                          <span className={v.muted}>
                            {formatAction(item.entityType, item.action)}
                          </span>
                        </p>
                        <p className={cn("text-xs mt-0.5", v.muted)}>
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
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  href,
  v,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "primary" | "green" | "blue" | "red" | "default";
  href?: string;
  v: (typeof variants)[ClassicVariant];
}) {
  const card = (
    <Card data-stat-color={color} className={cn(v.card, href && `transition-shadow ${v.cardHover} cursor-pointer`)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={cn("text-sm", v.muted)}>{title}</p>
            <p className={cn("mt-1 text-2xl font-bold tracking-tight", v.statValue[color])}>
              {value}
            </p>
            <p className={cn("mt-1 text-xs", v.muted)}>{subtitle}</p>
          </div>
          <div className={cn("rounded-xl p-3", v.statIcon[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{card}</Link>;
  }
  return card;
}

function QuickAction({
  href,
  icon: Icon,
  label,
  v,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  v: (typeof variants)[ClassicVariant];
}) {
  return (
    <Link href={href}>
      <Card className={cn("transition-all cursor-pointer", v.card, v.cardHover, v.quickAction)}>
        <CardContent className="flex items-center gap-3 py-3 px-4">
          <div className={cn("rounded-lg p-2", v.quickActionIcon)}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">{label}</span>
        </CardContent>
      </Card>
    </Link>
  );
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAction(entityType: string, action: string): string {
  const typeLabels: Record<string, string> = {
    job: "a job",
    estimate: "an estimate",
    invoice: "an invoice",
    payment: "a payment",
    customer: "a customer",
    user: "a team member",
    settings: "settings",
  };
  const actionLabels: Record<string, string> = {
    created: "created",
    updated: "updated",
    sent: "sent",
    approved: "approved",
    declined: "declined",
    voided: "voided",
    status_changed: "changed status of",
    assigned: "assigned",
    invited: "invited",
    deactivated: "deactivated",
    reactivated: "reactivated",
    recorded: "recorded",
    company_updated: "updated company profile",
    settings_updated: "updated",
  };

  const entity = typeLabels[entityType] || entityType;
  const verb = actionLabels[action] || action;

  return `${verb} ${entity}`;
}
