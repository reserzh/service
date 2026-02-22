import { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getDashboardStats, getRecentActivity, getUpcomingJobs } from "@/lib/services/reports";
import { PageHeader } from "@/components/layout/page-header";
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
  Plus,
  ArrowRight,
  CalendarDays,
  Users,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const ctx = await requireAuth();

  const [stats, activity, upcoming] = await Promise.all([
    getDashboardStats(ctx),
    getRecentActivity(ctx, 8),
    getUpcomingJobs(ctx, 5),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good ${getGreeting()}, ${ctx.firstName}`}
        description="Here's what's happening today."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/schedule">
              <CalendarDays className="mr-2 h-3.5 w-3.5" />
              Schedule
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/jobs/new">
              <Plus className="mr-2 h-3.5 w-3.5" />
              New Job
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Jobs"
          value={String(stats.todaysJobs)}
          subtitle={`${stats.todaysCompleted} completed`}
          icon={Briefcase}
          color="primary"
          href="/schedule"
        />
        <StatCard
          title="Revenue (MTD)"
          value={formatCurrency(stats.revenueMTD)}
          subtitle={`${stats.invoicesPaidMTD} invoices paid`}
          icon={DollarSign}
          color="green"
          href="/reports"
        />
        <StatCard
          title="Open Estimates"
          value={String(stats.openEstimates)}
          subtitle={`${formatCurrency(stats.openEstimatesValue)} pending`}
          icon={FileText}
          color="blue"
          href="/estimates?status=sent,viewed"
        />
        <StatCard
          title="Overdue Invoices"
          value={String(stats.overdueInvoices)}
          subtitle={`${formatCurrency(stats.overdueValue)} outstanding`}
          icon={AlertTriangle}
          color={stats.overdueInvoices > 0 ? "red" : "default"}
          href="/invoices?status=overdue"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 lg:grid-cols-5">
        <QuickAction href="/jobs/new" icon={Briefcase} label="New Job" />
        <QuickAction href="/estimates/new" icon={FileText} label="New Estimate" />
        <QuickAction href="/invoices/new" icon={DollarSign} label="New Invoice" />
        <QuickAction href="/customers/new" icon={Users} label="New Customer" />
        <QuickAction href="/dispatch" icon={TrendingUp} label="Dispatch Board" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Jobs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-primary" />
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
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <CalendarDays className="h-8 w-8 mb-2 text-muted-foreground/40" />
                <p className="text-sm">No upcoming jobs today.</p>
                <p className="mt-1 text-xs">Scheduled jobs will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                      <div className="text-center min-w-[50px]">
                        {job.scheduledStart ? (
                          <>
                            <p className="text-sm font-semibold text-primary">
                              {format(new Date(job.scheduledStart), "h:mm")}
                            </p>
                            <p className="text-[10px] uppercase text-muted-foreground">
                              {format(new Date(job.scheduledStart), "a")}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">TBD</p>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{job.summary}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{job.jobNumber}</span>
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

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-primary" />
                Recent Activity
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Clock className="h-8 w-8 mb-2 text-muted-foreground/40" />
                <p className="text-sm">No recent activity.</p>
                <p className="mt-1 text-xs">
                  Jobs, estimates, and invoices will show up here.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 rounded-lg px-2 py-2 text-sm">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-primary/40 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="leading-snug">
                        <span className="font-medium">
                          {item.userFirstName} {item.userLastName}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {formatAction(item.entityType, item.action)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "primary" | "green" | "blue" | "red" | "default";
  href?: string;
}) {
  const colorMap = {
    primary: {
      icon: "bg-primary/10 text-primary",
      value: "",
    },
    green: {
      icon: "bg-status-completed/10 text-status-completed",
      value: "text-status-completed",
    },
    blue: {
      icon: "bg-status-scheduled/10 text-status-scheduled",
      value: "",
    },
    red: {
      icon: "bg-status-overdue/10 text-status-overdue",
      value: "text-status-overdue",
    },
    default: {
      icon: "bg-muted text-muted-foreground",
      value: "",
    },
  };

  const c = colorMap[color];

  const card = (
    <Card className={href ? "transition-shadow hover:shadow-md cursor-pointer" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`mt-1 text-2xl font-bold tracking-tight ${c.value}`}>
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={`rounded-xl p-3 ${c.icon}`}>
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
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-all hover:shadow-md hover:border-primary/20 cursor-pointer">
        <CardContent className="flex items-center gap-3 py-3 px-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-4 w-4 text-primary" />
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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
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
