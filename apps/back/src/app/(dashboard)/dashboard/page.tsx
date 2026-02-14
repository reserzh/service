import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { getDashboardStats, getRecentActivity } from "@/lib/services/reports";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Briefcase,
  Users,
  DollarSign,
  Clock,
  FileText,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const ctx = await requireAuth();

  const [stats, activity] = await Promise.all([
    getDashboardStats(ctx),
    getRecentActivity(ctx, 10),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good ${getGreeting()}, ${ctx.firstName}`}
        description="Here's what's happening today."
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Jobs"
          value={String(stats.todaysJobs)}
          subtitle={`${stats.todaysCompleted} completed`}
          icon={Briefcase}
        />
        <StatCard
          title="Revenue (MTD)"
          value={`$${stats.revenueMTD.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          subtitle={`${stats.invoicesPaidMTD} invoices paid`}
          icon={DollarSign}
        />
        <StatCard
          title="Open Estimates"
          value={String(stats.openEstimates)}
          subtitle={`$${stats.openEstimatesValue.toLocaleString("en-US", { minimumFractionDigits: 2 })} pending`}
          icon={FileText}
        />
        <StatCard
          title="Overdue Invoices"
          value={String(stats.overdueInvoices)}
          subtitle={`$${stats.overdueValue.toLocaleString("en-US", { minimumFractionDigits: 2 })} outstanding`}
          icon={AlertCircle}
          alert={stats.overdueInvoices > 0}
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <p className="text-sm">No recent activity.</p>
              <p className="mt-1 text-xs">
                Jobs, estimates, and invoices will show up here as your team
                works.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p>
                      <span className="font-medium">
                        {item.userFirstName} {item.userLastName}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {formatAction(item.entityType, item.action)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
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
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  alert,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  alert?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`mt-1 text-2xl font-bold ${alert ? "text-destructive" : ""}`}>{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={`rounded-lg p-3 ${alert ? "bg-destructive/10" : "bg-muted"}`}>
            <Icon className={`h-5 w-5 ${alert ? "text-destructive" : "text-muted-foreground"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
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
