import { requireCustomerAuth } from "@/lib/portal-auth";
import { PortalShell } from "@/components/portal/portal-shell";

export default async function AuthenticatedPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCustomerAuth();

  return <PortalShell>{children}</PortalShell>;
}
