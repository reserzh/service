import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tenants } from "@fieldservice/shared/db/schema";
import { eq } from "drizzle-orm";
import type { TenantSettings } from "@fieldservice/shared/db/schema/tenants";
import { CallWidget } from "@/components/calls/call-widget";
import { TradeTypeProvider } from "@/components/providers/trade-type-provider";
import type { TradeType } from "@fieldservice/api-types/constants";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  const tenantRow = await db
    .select({
      settings: tenants.settings,
      onboardingCompleted: tenants.onboardingCompleted,
    })
    .from(tenants)
    .where(eq(tenants.id, user.tenantId))
    .limit(1)
    .then((rows) => rows[0]);

  if (tenantRow && !tenantRow.onboardingCompleted) {
    redirect("/onboarding");
  }

  const settings = (tenantRow?.settings ?? {}) as TenantSettings;
  const preset = (settings.dashboardPreset ?? "classic") as string;

  const userProps = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  };

  return (
    <TradeTypeProvider tradeType={settings.tradeType as TradeType | undefined}>
      <div
        data-theme={preset === "classic" ? undefined : preset}
        className="min-h-screen bg-background text-foreground"
      >
        <SidebarProvider>
          <AppSidebar user={userProps} />
          <SidebarInset>
            <Topbar user={userProps} />
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
        <CallWidget />
      </div>
    </TradeTypeProvider>
  );
}
