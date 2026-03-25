"use server";

import { requireAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { disconnectCompany } from "@/lib/quickbooks/oauth";
import {
  resyncEntity,
  fetchQBAccounts,
  getQBConnectionStatus,
  listSyncLog,
  bulkSyncAllEntities,
  type BulkSyncResult,
} from "@/lib/services/quickbooks";
import { db } from "@/lib/db";
import { tenants } from "@fieldservice/shared/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getActionErrorMessage } from "@/lib/api/errors";
import { z } from "zod";

const qbSettingsSchema = z.object({
  incomeAccountId: z.string().optional(),
  expenseAccountId: z.string().optional(),
  taxStrategy: z.enum(["global", "per_line", "none"]).optional(),
  syncEstimates: z.boolean().optional(),
  defaultPaymentMethodId: z.string().optional(),
}).strict();

export type QBActionState = {
  error?: string;
  success?: boolean;
};

export async function disconnectQuickBooksAction(): Promise<QBActionState> {
  try {
    const ctx = await requireAuth();
    assertPermission(ctx, "integrations", "manage");

    await disconnectCompany(ctx.tenantId);
    revalidatePath("/settings/integrations");

    return { success: true };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to disconnect QuickBooks") };
  }
}

export async function updateQBSettingsAction(settings: z.infer<typeof qbSettingsSchema>): Promise<QBActionState> {
  try {
    const ctx = await requireAuth();
    assertPermission(ctx, "integrations", "manage");

    // Validate input to reject unknown keys
    const parsed = qbSettingsSchema.safeParse(settings);
    if (!parsed.success) {
      return { error: "Invalid settings data" };
    }

    // Atomic JSON merge to avoid read-modify-write race conditions
    const qbPatch = JSON.stringify(parsed.data);
    await db
      .update(tenants)
      .set({
        settings: sql`jsonb_set(
          coalesce(${tenants.settings}, '{}'::jsonb),
          '{quickbooks}',
          coalesce(${tenants.settings}->'quickbooks', '{}'::jsonb) || ${qbPatch}::jsonb
        )`,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, ctx.tenantId));

    revalidatePath("/settings/integrations");
    return { success: true };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to update QuickBooks settings") };
  }
}

export async function retryQBSyncAction(
  entityType: string,
  localEntityId: string
): Promise<QBActionState> {
  try {
    const ctx = await requireAuth();
    assertPermission(ctx, "integrations", "manage");
    await resyncEntity(ctx, entityType, localEntityId);
    revalidatePath("/settings/integrations/quickbooks/sync-log");
    return { success: true };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to sync entity to QuickBooks") };
  }
}

export async function bulkSyncAction(): Promise<
  { result: BulkSyncResult } | { error: string }
> {
  try {
    const ctx = await requireAuth();
    assertPermission(ctx, "integrations", "manage");
    const result = await bulkSyncAllEntities(ctx);
    revalidatePath("/settings/integrations");
    return { result };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Bulk sync failed") };
  }
}

export async function fetchQBAccountsAction() {
  try {
    const ctx = await requireAuth();
    assertPermission(ctx, "integrations", "read");
    return { accounts: await fetchQBAccounts(ctx) };
  } catch (error) {
    return { error: getActionErrorMessage(error, "Failed to fetch QuickBooks accounts") };
  }
}

export async function getQBStatusAction() {
  try {
    const ctx = await requireAuth();
    assertPermission(ctx, "integrations", "read");
    return await getQBConnectionStatus(ctx);
  } catch (error) {
    return { connected: false as const, error: getActionErrorMessage(error, "Failed to get status") };
  }
}

export async function getSyncLogAction(params: {
  page?: number;
  pageSize?: number;
  entityType?: string;
  status?: string;
}) {
  try {
    const ctx = await requireAuth();
    assertPermission(ctx, "integrations", "read");
    return await listSyncLog(ctx, params);
  } catch {
    return { data: [], meta: { page: 1, pageSize: 25, total: 0 } };
  }
}
