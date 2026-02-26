import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { BlueprintTopNav } from "@/components/layout/blueprint-top-nav";
import { Topbar } from "@/components/layout/topbar";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tenants } from "@fieldservice/shared/db/schema";
import { eq } from "drizzle-orm";
import type { TenantSettings } from "@fieldservice/shared/db/schema/tenants";
import { cn } from "@/lib/utils";

const DARK_THEMES = new Set(["mission-control", "glass", "executive"]);

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  const tenantRow = await db
    .select({ settings: tenants.settings })
    .from(tenants)
    .where(eq(tenants.id, user.tenantId))
    .limit(1)
    .then((rows) => rows[0]);

  const settings = (tenantRow?.settings ?? {}) as TenantSettings;
  const preset = (settings.dashboardPreset ?? "classic") as string;
  const isBlueprint = preset === "blueprint";

  return (
    <div
      data-theme={preset === "classic" ? undefined : preset}
      className={cn(
        "min-h-screen bg-background text-foreground font-sans",
        DARK_THEMES.has(preset) && "dark"
      )}
    >
      {isBlueprint ? (
        <>
          <BlueprintTopNav
            user={{
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              role: user.role,
            }}
          />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </>
      ) : (
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <Topbar
              user={{
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
              }}
            />
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      )}
    </div>
  );
}
