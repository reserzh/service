import { db } from "@/lib/db";
import { activityLog } from "@fieldservice/shared/db/schema";
import type { UserContext } from "@/lib/auth";

export async function logActivity(
  ctx: UserContext,
  entityType: string,
  entityId: string,
  action: string,
  changes?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  await db.insert(activityLog).values({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    entityType,
    entityId,
    action,
    changes: changes ?? null,
    ipAddress: ipAddress ?? null,
  });
}
