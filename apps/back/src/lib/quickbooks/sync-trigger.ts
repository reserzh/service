import { db } from "@/lib/db";
import { qbConnections } from "@fieldservice/shared/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Non-blocking trigger for QuickBooks sync.
 * Fires after DB transaction commits (via setTimeout).
 * Never throws — all errors are caught and logged.
 */
export function triggerQBSync(
  tenantId: string,
  entityType: string,
  entityId: string,
  op: "create" | "update"
): void {
  // Bail immediately if QB is not configured
  if (!process.env.QB_CLIENT_ID) return;

  // Run after the current transaction commits
  setTimeout(async () => {
    try {
      // Quick check if tenant has an active QB connection
      const [conn] = await db
        .select({ id: qbConnections.id })
        .from(qbConnections)
        .where(and(eq(qbConnections.tenantId, tenantId), eq(qbConnections.isActive, true)))
        .limit(1);

      if (!conn) return;

      // Dynamic import to avoid circular dependencies and loading QB code
      // when QB is not configured
      const { syncEntityToQB } = await import("@/lib/services/quickbooks");
      await syncEntityToQB(tenantId, entityType, entityId);
    } catch (error) {
      console.error(`[QB Sync] Failed to sync ${entityType}/${entityId}:`, error);
      // Errors are logged but never thrown to prevent affecting the main flow
    }
  }, 100);
}
