import { db } from "@/lib/db";
import {
  qbConnections,
  qbEntityMappings,
  qbSyncLog,
  customers,
  properties,
  invoices,
  invoiceLineItems,
  payments,
  pricebookItems,
  estimates,
  estimateOptions,
  estimateOptionItems,
  tenants,
} from "@fieldservice/shared/db/schema";
import { eq, and, desc, sql, isNull, inArray } from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { qbCreate, qbUpdate, qbQuery, logSync, QBApiError } from "@/lib/quickbooks/client";
import {
  mapCustomerToQB,
  mapPricebookItemToQB,
  mapInvoiceToQB,
  mapPaymentToQB,
  mapEstimateToQB,
} from "@/lib/quickbooks/mappers";
import type {
  QBCustomer,
  QBItem,
  QBInvoice,
  QBPayment,
  QBEstimate,
  QBAccount,
  QBResponse,
} from "@/lib/quickbooks/types";
import type { TenantSettings } from "@fieldservice/shared/db/schema";

// ---------------------------------------------------------------------------
// Connection status
// ---------------------------------------------------------------------------
export async function isQBConnected(tenantId: string): Promise<boolean> {
  const [conn] = await db
    .select({ id: qbConnections.id })
    .from(qbConnections)
    .where(and(eq(qbConnections.tenantId, tenantId), eq(qbConnections.isActive, true)))
    .limit(1);
  return !!conn;
}

export async function getQBConnectionStatus(ctx: UserContext) {
  assertPermission(ctx, "integrations", "read");

  const [conn] = await db
    .select()
    .from(qbConnections)
    .where(and(eq(qbConnections.tenantId, ctx.tenantId), eq(qbConnections.isActive, true)))
    .limit(1);

  if (!conn) {
    return { connected: false as const };
  }

  // Get sync stats
  const stats = await getSyncStats(ctx.tenantId);

  return {
    connected: true as const,
    companyName: conn.companyName,
    connectedAt: conn.createdAt,
    refreshTokenExpiresAt: conn.refreshTokenExpiresAt,
    stats,
  };
}

async function getSyncStats(tenantId: string) {
  const [result] = await db
    .select({
      total: sql<number>`count(*)`,
      success: sql<number>`count(*) filter (where ${qbSyncLog.status} = 'success')`,
      failed: sql<number>`count(*) filter (where ${qbSyncLog.status} = 'error')`,
      lastSyncAt: sql<Date | null>`max(${qbSyncLog.createdAt})`,
    })
    .from(qbSyncLog)
    .where(eq(qbSyncLog.tenantId, tenantId));

  return {
    total: Number(result.total),
    success: Number(result.success),
    failed: Number(result.failed),
    lastSyncAt: result.lastSyncAt,
  };
}

// ---------------------------------------------------------------------------
// Entity sync dispatcher
// ---------------------------------------------------------------------------
export async function syncEntityToQB(
  tenantId: string,
  entityType: string,
  entityId: string,
): Promise<void> {
  switch (entityType) {
    case "customer":
      await syncCustomerToQB(tenantId, entityId);
      break;
    case "invoice":
      await syncInvoiceToQB(tenantId, entityId);
      break;
    case "payment":
      await syncPaymentToQB(tenantId, entityId);
      break;
    case "pricebook":
      await syncPricebookItemToQB(tenantId, entityId);
      break;
    case "estimate": {
      // Check if estimate sync is enabled
      const [t] = await db
        .select({ settings: tenants.settings })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);
      if ((t?.settings as TenantSettings | null)?.quickbooks?.syncEstimates === false) return;
      await syncEstimateToQB(tenantId, entityId);
      break;
    }
    default:
      console.warn(`[QB Sync] Unknown entity type: ${entityType}`);
  }
}

// ---------------------------------------------------------------------------
// Customer sync
// ---------------------------------------------------------------------------
async function syncCustomerToQB(tenantId: string, customerId: string): Promise<string> {
  const startTime = Date.now();

  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)))
    .limit(1);

  if (!customer) {
    throw new QBApiError("Customer not found for QB sync");
  }

  // Get primary property for billing address
  const [property] = await db
    .select()
    .from(properties)
    .where(
      and(
        eq(properties.customerId, customerId),
        eq(properties.tenantId, tenantId),
        eq(properties.isPrimary, true)
      )
    )
    .limit(1);

  // Check existing mapping
  const [mapping] = await db
    .select()
    .from(qbEntityMappings)
    .where(
      and(
        eq(qbEntityMappings.tenantId, tenantId),
        eq(qbEntityMappings.entityType, "customer"),
        eq(qbEntityMappings.localEntityId, customerId)
      )
    )
    .limit(1);

  try {
    let qbEntityId: string;
    let syncToken: string | undefined;

    if (mapping) {
      // Update existing QB customer
      const qbData = mapCustomerToQB(customer, property, mapping.qbSyncToken ?? undefined);
      qbData.Id = mapping.qbEntityId;

      const result = await qbUpdate<{ Customer: QBCustomer }>(
        tenantId,
        "/customer",
        qbData
      );
      qbEntityId = result.Customer.Id!;
      syncToken = result.Customer.SyncToken;
    } else {
      // Create new QB customer
      const qbData = mapCustomerToQB(customer, property);
      let result: { Customer: QBCustomer };

      try {
        result = await qbCreate<{ Customer: QBCustomer }>(
          tenantId,
          "/customer",
          qbData
        );
      } catch (error) {
        // Handle duplicate DisplayName — append customer ID
        if (error instanceof QBApiError && error.qbCode === "6240") {
          qbData.DisplayName = `${qbData.DisplayName} (${customerId.slice(0, 8)})`;
          result = await qbCreate<{ Customer: QBCustomer }>(
            tenantId,
            "/customer",
            qbData
          );
        } else {
          throw error;
        }
      }

      qbEntityId = result.Customer.Id!;
      syncToken = result.Customer.SyncToken;
    }

    // Upsert mapping
    await upsertMapping(tenantId, "customer", customerId, qbEntityId, syncToken);

    await logSync({
      tenantId,
      entityType: "customer",
      localEntityId: customerId,
      qbEntityId,
      operation: mapping ? "update" : "create",
      status: "success",
      durationMs: Date.now() - startTime,
    });

    return qbEntityId;
  } catch (error) {
    await logSync({
      tenantId,
      entityType: "customer",
      localEntityId: customerId,
      operation: mapping ? "update" : "create",
      status: "error",
      errorMessage: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
    });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Pricebook item sync
// ---------------------------------------------------------------------------
async function syncPricebookItemToQB(tenantId: string, itemId: string): Promise<string> {
  const startTime = Date.now();

  const [item] = await db
    .select()
    .from(pricebookItems)
    .where(and(eq(pricebookItems.id, itemId), eq(pricebookItems.tenantId, tenantId)))
    .limit(1);

  if (!item) {
    throw new QBApiError("Pricebook item not found for QB sync");
  }

  // Get tenant QB settings for account refs
  const [tenant] = await db
    .select({ settings: tenants.settings })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  const qbSettings = (tenant?.settings as TenantSettings | null)?.quickbooks;
  const incomeAccountRef = qbSettings?.incomeAccountId
    ? { value: qbSettings.incomeAccountId }
    : undefined;
  const expenseAccountRef = qbSettings?.expenseAccountId
    ? { value: qbSettings.expenseAccountId }
    : undefined;

  const [mapping] = await db
    .select()
    .from(qbEntityMappings)
    .where(
      and(
        eq(qbEntityMappings.tenantId, tenantId),
        eq(qbEntityMappings.entityType, "pricebook_item"),
        eq(qbEntityMappings.localEntityId, itemId)
      )
    )
    .limit(1);

  try {
    let qbEntityId: string;
    let syncToken: string | undefined;

    if (mapping) {
      const qbData = mapPricebookItemToQB(
        item,
        incomeAccountRef,
        expenseAccountRef,
        mapping.qbSyncToken ?? undefined
      );
      qbData.Id = mapping.qbEntityId;

      const result = await qbUpdate<{ Item: QBItem }>(tenantId, "/item", qbData);
      qbEntityId = result.Item.Id!;
      syncToken = result.Item.SyncToken;
    } else {
      const qbData = mapPricebookItemToQB(item, incomeAccountRef, expenseAccountRef);
      const result = await qbCreate<{ Item: QBItem }>(tenantId, "/item", qbData);
      qbEntityId = result.Item.Id!;
      syncToken = result.Item.SyncToken;
    }

    await upsertMapping(tenantId, "pricebook_item", itemId, qbEntityId, syncToken);

    await logSync({
      tenantId,
      entityType: "pricebook_item",
      localEntityId: itemId,
      qbEntityId,
      operation: mapping ? "update" : "create",
      status: "success",
      durationMs: Date.now() - startTime,
    });

    return qbEntityId;
  } catch (error) {
    await logSync({
      tenantId,
      entityType: "pricebook_item",
      localEntityId: itemId,
      operation: mapping ? "update" : "create",
      status: "error",
      errorMessage: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
    });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Invoice sync (auto-resolves customer + item dependencies)
// ---------------------------------------------------------------------------
async function syncInvoiceToQB(tenantId: string, invoiceId: string): Promise<string> {
  const startTime = Date.now();

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.tenantId, tenantId)))
    .limit(1);

  if (!invoice) {
    throw new QBApiError("Invoice not found for QB sync");
  }

  // Ensure customer is synced first
  const customerQBId = await ensureCustomerSynced(tenantId, invoice.customerId);

  // Get line items
  const lineItemRows = await db
    .select()
    .from(invoiceLineItems)
    .where(and(eq(invoiceLineItems.invoiceId, invoiceId), eq(invoiceLineItems.tenantId, tenantId)));

  // Ensure pricebook items are synced
  const itemMappings = await ensurePricebookItemsSynced(
    tenantId,
    lineItemRows.map((li) => li.pricebookItemId).filter(Boolean) as string[]
  );

  const [mapping] = await db
    .select()
    .from(qbEntityMappings)
    .where(
      and(
        eq(qbEntityMappings.tenantId, tenantId),
        eq(qbEntityMappings.entityType, "invoice"),
        eq(qbEntityMappings.localEntityId, invoiceId)
      )
    )
    .limit(1);

  try {
    const qbData = mapInvoiceToQB(
      {
        invoiceNumber: invoice.invoiceNumber,
        dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
        createdAt: invoice.createdAt,
      },
      customerQBId,
      lineItemRows,
      itemMappings,
      mapping?.qbSyncToken ?? undefined
    );

    let qbEntityId: string;
    let syncToken: string | undefined;

    if (mapping) {
      qbData.Id = mapping.qbEntityId;
      const result = await qbUpdate<{ Invoice: QBInvoice }>(tenantId, "/invoice", qbData);
      qbEntityId = result.Invoice.Id!;
      syncToken = result.Invoice.SyncToken;
    } else {
      const result = await qbCreate<{ Invoice: QBInvoice }>(tenantId, "/invoice", qbData);
      qbEntityId = result.Invoice.Id!;
      syncToken = result.Invoice.SyncToken;
    }

    await upsertMapping(tenantId, "invoice", invoiceId, qbEntityId, syncToken);

    await logSync({
      tenantId,
      entityType: "invoice",
      localEntityId: invoiceId,
      qbEntityId,
      operation: mapping ? "update" : "create",
      status: "success",
      durationMs: Date.now() - startTime,
    });

    return qbEntityId;
  } catch (error) {
    await logSync({
      tenantId,
      entityType: "invoice",
      localEntityId: invoiceId,
      operation: mapping ? "update" : "create",
      status: "error",
      errorMessage: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
    });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Payment sync (auto-resolves customer + invoice dependencies)
// ---------------------------------------------------------------------------
async function syncPaymentToQB(tenantId: string, paymentId: string): Promise<string> {
  const startTime = Date.now();

  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.tenantId, tenantId)))
    .limit(1);

  if (!payment) {
    throw new QBApiError("Payment not found for QB sync");
  }

  // Ensure customer and invoice are synced
  const customerQBId = await ensureCustomerSynced(tenantId, payment.customerId);
  const invoiceQBId = await ensureInvoiceSynced(tenantId, payment.invoiceId);

  const [mapping] = await db
    .select()
    .from(qbEntityMappings)
    .where(
      and(
        eq(qbEntityMappings.tenantId, tenantId),
        eq(qbEntityMappings.entityType, "payment"),
        eq(qbEntityMappings.localEntityId, paymentId)
      )
    )
    .limit(1);

  try {
    const qbData = mapPaymentToQB(
      { amount: payment.amount, createdAt: payment.createdAt },
      customerQBId,
      invoiceQBId,
      mapping?.qbSyncToken ?? undefined
    );

    let qbEntityId: string;
    let syncToken: string | undefined;

    if (mapping) {
      qbData.Id = mapping.qbEntityId;
      const result = await qbUpdate<{ Payment: QBPayment }>(tenantId, "/payment", qbData);
      qbEntityId = result.Payment.Id!;
      syncToken = result.Payment.SyncToken;
    } else {
      const result = await qbCreate<{ Payment: QBPayment }>(tenantId, "/payment", qbData);
      qbEntityId = result.Payment.Id!;
      syncToken = result.Payment.SyncToken;
    }

    await upsertMapping(tenantId, "payment", paymentId, qbEntityId, syncToken);

    await logSync({
      tenantId,
      entityType: "payment",
      localEntityId: paymentId,
      qbEntityId,
      operation: mapping ? "update" : "create",
      status: "success",
      durationMs: Date.now() - startTime,
    });

    return qbEntityId;
  } catch (error) {
    await logSync({
      tenantId,
      entityType: "payment",
      localEntityId: paymentId,
      operation: mapping ? "update" : "create",
      status: "error",
      errorMessage: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
    });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Estimate sync
// ---------------------------------------------------------------------------
async function syncEstimateToQB(tenantId: string, estimateId: string): Promise<string> {
  const startTime = Date.now();

  const [estimate] = await db
    .select()
    .from(estimates)
    .where(and(eq(estimates.id, estimateId), eq(estimates.tenantId, tenantId)))
    .limit(1);

  if (!estimate) {
    throw new QBApiError("Estimate not found for QB sync");
  }

  // Ensure customer is synced
  const customerQBId = await ensureCustomerSynced(tenantId, estimate.customerId);

  // Get the approved option's line items (or first option if none approved)
  const optionId = estimate.approvedOptionId;
  const options = await db
    .select()
    .from(estimateOptions)
    .where(and(eq(estimateOptions.estimateId, estimateId), eq(estimateOptions.tenantId, tenantId)))
    .orderBy(estimateOptions.sortOrder);

  const targetOption = optionId
    ? options.find((o) => o.id === optionId)
    : options[0];

  if (!targetOption) {
    throw new QBApiError("Estimate has no options to sync");
  }

  const lineItemRows = await db
    .select()
    .from(estimateOptionItems)
    .where(
      and(
        eq(estimateOptionItems.optionId, targetOption.id),
        eq(estimateOptionItems.tenantId, tenantId)
      )
    );

  // Ensure pricebook items are synced
  const itemMappings = await ensurePricebookItemsSynced(
    tenantId,
    lineItemRows.map((li) => li.pricebookItemId).filter(Boolean) as string[]
  );

  const [mapping] = await db
    .select()
    .from(qbEntityMappings)
    .where(
      and(
        eq(qbEntityMappings.tenantId, tenantId),
        eq(qbEntityMappings.entityType, "estimate"),
        eq(qbEntityMappings.localEntityId, estimateId)
      )
    )
    .limit(1);

  try {
    const qbData = mapEstimateToQB(
      {
        estimateNumber: estimate.estimateNumber,
        createdAt: estimate.createdAt,
        validUntil: estimate.validUntil ? new Date(estimate.validUntil) : null,
      },
      customerQBId,
      lineItemRows,
      itemMappings,
      mapping?.qbSyncToken ?? undefined
    );

    let qbEntityId: string;
    let syncToken: string | undefined;

    if (mapping) {
      qbData.Id = mapping.qbEntityId;
      const result = await qbUpdate<{ Estimate: QBEstimate }>(tenantId, "/estimate", qbData);
      qbEntityId = result.Estimate.Id!;
      syncToken = result.Estimate.SyncToken;
    } else {
      const result = await qbCreate<{ Estimate: QBEstimate }>(tenantId, "/estimate", qbData);
      qbEntityId = result.Estimate.Id!;
      syncToken = result.Estimate.SyncToken;
    }

    await upsertMapping(tenantId, "estimate", estimateId, qbEntityId, syncToken);

    await logSync({
      tenantId,
      entityType: "estimate",
      localEntityId: estimateId,
      qbEntityId,
      operation: mapping ? "update" : "create",
      status: "success",
      durationMs: Date.now() - startTime,
    });

    return qbEntityId;
  } catch (error) {
    await logSync({
      tenantId,
      entityType: "estimate",
      localEntityId: estimateId,
      operation: mapping ? "update" : "create",
      status: "error",
      errorMessage: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
    });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Manual re-sync + log listing
// ---------------------------------------------------------------------------
export async function resyncEntity(
  ctx: UserContext,
  entityType: string,
  localEntityId: string
): Promise<void> {
  assertPermission(ctx, "integrations", "manage");
  await syncEntityToQB(ctx.tenantId, entityType, localEntityId);
}

export interface ListSyncLogParams {
  page?: number;
  pageSize?: number;
  entityType?: string;
  status?: string;
}

export async function listSyncLog(ctx: UserContext, params: ListSyncLogParams = {}) {
  assertPermission(ctx, "integrations", "read");

  const { page = 1, pageSize: rawPageSize = 25, entityType, status } = params;
  const pageSize = Math.min(Math.max(rawPageSize, 1), 100);
  const offset = (page - 1) * pageSize;

  const conditions = [eq(qbSyncLog.tenantId, ctx.tenantId)];

  if (entityType) {
    conditions.push(eq(qbSyncLog.entityType, entityType));
  }
  if (status) {
    conditions.push(eq(qbSyncLog.status, status));
  }

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(qbSyncLog)
      .where(and(...conditions))
      .orderBy(desc(qbSyncLog.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(qbSyncLog)
      .where(and(...conditions)),
  ]);

  return {
    data,
    meta: {
      page,
      pageSize,
      total: Number(countResult[0].count),
    },
  };
}

/**
 * Fetch QB accounts for settings dropdowns.
 */
export async function fetchQBAccounts(ctx: UserContext): Promise<QBAccount[]> {
  assertPermission(ctx, "integrations", "read");

  const result = await qbQuery<QBResponse<QBAccount>>(
    ctx.tenantId,
    "SELECT * FROM Account WHERE Active = true MAXRESULTS 200"
  );

  return (result.QueryResponse?.Account as QBAccount[] | undefined) ?? [];
}

// ---------------------------------------------------------------------------
// Dependency helpers
// ---------------------------------------------------------------------------
async function ensureCustomerSynced(tenantId: string, customerId: string): Promise<string> {
  const [mapping] = await db
    .select()
    .from(qbEntityMappings)
    .where(
      and(
        eq(qbEntityMappings.tenantId, tenantId),
        eq(qbEntityMappings.entityType, "customer"),
        eq(qbEntityMappings.localEntityId, customerId)
      )
    )
    .limit(1);

  if (mapping) return mapping.qbEntityId;
  return syncCustomerToQB(tenantId, customerId);
}

async function ensureInvoiceSynced(tenantId: string, invoiceId: string): Promise<string> {
  const [mapping] = await db
    .select()
    .from(qbEntityMappings)
    .where(
      and(
        eq(qbEntityMappings.tenantId, tenantId),
        eq(qbEntityMappings.entityType, "invoice"),
        eq(qbEntityMappings.localEntityId, invoiceId)
      )
    )
    .limit(1);

  if (mapping) return mapping.qbEntityId;
  return syncInvoiceToQB(tenantId, invoiceId);
}

async function ensurePricebookItemsSynced(
  tenantId: string,
  itemIds: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (itemIds.length === 0) return result;

  const uniqueIds = [...new Set(itemIds)];

  // Get existing mappings
  const existingMappings = await db
    .select()
    .from(qbEntityMappings)
    .where(
      and(
        eq(qbEntityMappings.tenantId, tenantId),
        eq(qbEntityMappings.entityType, "pricebook_item"),
        inArray(qbEntityMappings.localEntityId, uniqueIds)
      )
    );

  for (const m of existingMappings) {
    result.set(m.localEntityId, m.qbEntityId);
  }

  // Sync missing items
  for (const id of uniqueIds) {
    if (!result.has(id)) {
      try {
        const qbId = await syncPricebookItemToQB(tenantId, id);
        result.set(id, qbId);
      } catch {
        // Skip items that fail to sync — they'll use fallback in mapper
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Mapping upsert
// ---------------------------------------------------------------------------
async function upsertMapping(
  tenantId: string,
  entityType: string,
  localEntityId: string,
  qbEntityId: string,
  syncToken?: string
): Promise<void> {
  const [existing] = await db
    .select()
    .from(qbEntityMappings)
    .where(
      and(
        eq(qbEntityMappings.tenantId, tenantId),
        eq(qbEntityMappings.entityType, entityType),
        eq(qbEntityMappings.localEntityId, localEntityId)
      )
    )
    .limit(1);

  if (existing) {
    await db
      .update(qbEntityMappings)
      .set({
        qbEntityId,
        qbSyncToken: syncToken ?? null,
        lastSyncStatus: "success",
        lastSyncError: null,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(qbEntityMappings.id, existing.id));
  } else {
    await db.insert(qbEntityMappings).values({
      tenantId,
      entityType,
      localEntityId,
      qbEntityId,
      qbSyncToken: syncToken ?? null,
      lastSyncStatus: "success",
      lastSyncedAt: new Date(),
    });
  }
}
