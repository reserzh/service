import { db } from "@/lib/db";
import { users } from "@fieldservice/shared/db/schema";
import { eq, and } from "drizzle-orm";
import type { UserContext, UserRole } from "@/lib/auth";
import crypto from "crypto";

export function verifyCronSecret(req: Request): boolean {
  const header = req.headers.get("authorization");
  if (!header) return false;
  const token = header.replace("Bearer ", "");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  // Hash both values to a fixed length to avoid leaking token length via timing
  const tokenHash = crypto.createHmac("sha256", "cron").update(token).digest();
  const secretHash = crypto.createHmac("sha256", "cron").update(secret).digest();
  return crypto.timingSafeEqual(tokenHash, secretHash);
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
