import { requireCustomerAuth } from "@/lib/portal-auth";
import { PortalSidebar } from "@/components/portal/portal-sidebar";

export default async function AuthenticatedPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCustomerAuth();

  return (
    <div className="flex h-screen">
      <PortalSidebar />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}
