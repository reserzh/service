import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { BlueprintTopNav } from "@/components/layout/blueprint-top-nav";
import { GlassTopNav } from "@/components/layout/glass-top-nav";
import { Topbar } from "@/components/layout/topbar";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tenants } from "@fieldservice/shared/db/schema";
import { eq } from "drizzle-orm";
import type { TenantSettings } from "@fieldservice/shared/db/schema/tenants";

const TOP_NAV_THEMES = new Set(["blueprint", "glass"]);

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
  const hasTopNav = TOP_NAV_THEMES.has(preset);

  const userProps = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  };

  return (
    <div
      data-theme={preset === "classic" ? undefined : preset}
      className="min-h-screen bg-background text-foreground font-sans"
    >
      {hasTopNav ? (
        <>
          {preset === "blueprint" ? (
            <BlueprintTopNav user={userProps} />
          ) : (
            <GlassTopNav user={userProps} />
          )}
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </>
      ) : (
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <Topbar user={userProps} />
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      )}
    </div>
  );
}
