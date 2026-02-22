import { redirect } from "next/navigation";
import { createPortalServerClient } from "./portal-supabase";
import { db } from "./db";
import { customers } from "@fieldservice/shared/db/schema";
import { eq, and } from "drizzle-orm";
import type { CustomerPortalContext } from "@fieldservice/api-types/models";

/**
 * Get the authenticated customer context for portal pages.
 * Redirects to /portal/login if not authenticated.
 */
export async function requireCustomerAuth(): Promise<CustomerPortalContext> {
  const supabase = await createPortalServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/portal/login");
  }

  const [customer] = await db
    .select({
      id: customers.id,
      tenantId: customers.tenantId,
      email: customers.email,
      firstName: customers.firstName,
      lastName: customers.lastName,
      portalAccessEnabled: customers.portalAccessEnabled,
    })
    .from(customers)
    .where(eq(customers.supabaseUserId, user.id))
    .limit(1);

  if (!customer || !customer.portalAccessEnabled) {
    redirect("/portal/login");
  }

  // Update last login timestamp (fire and forget)
  db.update(customers)
    .set({ lastPortalLoginAt: new Date() })
    .where(eq(customers.id, customer.id))
    .then(() => {})
    .catch(() => {});

  return {
    customerId: customer.id,
    tenantId: customer.tenantId,
    email: customer.email || user.email || "",
    firstName: customer.firstName,
    lastName: customer.lastName,
  };
}
