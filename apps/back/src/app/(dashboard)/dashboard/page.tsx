import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { getDashboardStats, getRecentActivity, getUpcomingJobs } from "@/lib/services/reports";
import { getUserDashboardLayout, getUserAIWidgets } from "@/lib/services/dashboard";
import { getPendingCrewRequests } from "@/lib/services/daily-reports";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { tenants } from "@fieldservice/shared/db/schema";
import { eq } from "drizzle-orm";
import type { TenantSettings } from "@fieldservice/shared/db/schema/tenants";
import type { DashboardData, DashboardPresetId, WidgetId, BuiltInWidgetId, AIWidgetData } from "./layouts/types";
import { DEFAULT_PRESET, DASHBOARD_PRESETS } from "./layouts/types";
import { ClassicLayout } from "./layouts/classic";
import { BlueprintLayout } from "./layouts/blueprint";
import { MissionControlLayout } from "./layouts/mission-control";
import { GlassLayout } from "./layouts/glass";
import { CustomizableDashboard } from "./customizable-dashboard";
import { isAIConfigured } from "@/lib/ai/client";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const ctx = await requireAuth();

  const [stats, activity, upcoming, tenantRow, userLayout, rawAIWidgets, crewRequests] = await Promise.all([
    getDashboardStats(ctx),
    getRecentActivity(ctx, 8),
    getUpcomingJobs(ctx, 8),
    db
      .select({ settings: tenants.settings })
      .from(tenants)
      .where(eq(tenants.id, ctx.tenantId))
      .limit(1)
      .then((rows) => rows[0]),
    getUserDashboardLayout(ctx),
    getUserAIWidgets(ctx),
    getPendingCrewRequests(ctx).catch(() => ({ date: new Date().toISOString().split("T")[0], requests: [] })),
  ]);

  const settings = (tenantRow?.settings ?? {}) as TenantSettings;
  const preset = (settings.dashboardPreset ?? DEFAULT_PRESET) as DashboardPresetId;
  const hiddenWidgets = new Set<WidgetId>((settings.dashboardHiddenWidgets ?? []) as WidgetId[]);

  const data: DashboardData = {
    stats,
    activity,
    upcoming,
    firstName: ctx.firstName,
    crewRequests,
  };

  const showPageHeader = preset === "classic" || preset === "executive" || preset === "arctic" || preset === "forge" || preset === "copper";

  // Get supported widgets for this preset
  const presetConfig = DASHBOARD_PRESETS.find((p) => p.id === preset) ?? DASHBOARD_PRESETS[0];
  const builtInWidgetIds = presetConfig.supportedWidgets.filter(
    (w) => !hiddenWidgets.has(w)
  ) as BuiltInWidgetId[];

  // Map AI widget data
  const aiWidgets: AIWidgetData[] = rawAIWidgets.map((w) => ({
    id: w.id,
    title: w.title,
    widgetConfig: w.widgetConfig,
    queryDefinition: w.queryDefinition,
    cachedData: w.cachedData as Record<string, unknown> | null,
    conversationId: w.conversationId,
    lastRefreshedAt: w.lastRefreshedAt,
  }));

  const aiConfigured = isAIConfigured();

  return (
    <div className="space-y-6">
      {showPageHeader && (
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
      )}

      <CustomizableDashboard
        aiWidgets={aiWidgets}
        userLayout={
          userLayout
            ? {
                widgetOrder: userLayout.widgetOrder,
                widgetSizes: userLayout.widgetSizes,
              }
            : null
        }
        builtInWidgetIds={builtInWidgetIds}
        aiConfigured={aiConfigured}
      >
        <DashboardLayout preset={preset} data={data} hiddenWidgets={hiddenWidgets} />
      </CustomizableDashboard>
    </div>
  );
}

function DashboardLayout({
  preset,
  data,
  hiddenWidgets,
}: {
  preset: DashboardPresetId;
  data: DashboardData;
  hiddenWidgets: Set<WidgetId>;
}) {
  switch (preset) {
    case "blueprint":
      return <BlueprintLayout data={data} hiddenWidgets={hiddenWidgets} />;
    case "mission-control":
      return <MissionControlLayout data={data} hiddenWidgets={hiddenWidgets} />;
    case "glass":
      return <GlassLayout data={data} hiddenWidgets={hiddenWidgets} />;
    case "executive":
      return <ClassicLayout data={data} hiddenWidgets={hiddenWidgets} variant="executive" />;
    case "arctic":
      return <ClassicLayout data={data} hiddenWidgets={hiddenWidgets} variant="arctic" />;
    case "forge":
      return <ClassicLayout data={data} hiddenWidgets={hiddenWidgets} variant="forge" />;
    case "copper":
      return <ClassicLayout data={data} hiddenWidgets={hiddenWidgets} variant="copper" />;
    case "classic":
    default:
      return <ClassicLayout data={data} hiddenWidgets={hiddenWidgets} />;
  }
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
