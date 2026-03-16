import { db } from "@/lib/db";
import { users } from "@fieldservice/shared/db/schema";
import { eq, and } from "drizzle-orm";
import type { UserContext, UserRole } from "@/lib/auth";

export function verifyCronSecret(req: Request): boolean {
  const header = req.headers.get("authorization");
  if (!header) return false;
  const token = header.replace("Bearer ", "");
  return token === process.env.CRON_SECRET;
}

export async function getSystemContext(tenantId: string): Promise<UserContext> {
  const [admin] = await db
    .select({
      id: users.id,
      tenantId: users.tenantId,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
    })
    .from(users)
    .where(
      and(
        eq(users.tenantId, tenantId),
        eq(users.role, "admin"),
        eq(users.isActive, true)
      )
    )
    .limit(1);

  if (!admin) {
    throw new Error(`No active admin found for tenant ${tenantId}`);
  }

  return {
    userId: admin.id,
    tenantId: admin.tenantId,
    role: admin.role as UserRole,
    email: admin.email,
    firstName: admin.firstName,
    lastName: admin.lastName,
  };
}
