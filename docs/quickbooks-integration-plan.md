# QuickBooks Integration Plan

## Context

The integrations page (`settings/integrations`) is currently a "Coming Soon" placeholder. This plan implements QuickBooks Online (QBO) integration as a **one-way push** (SERVICE → QuickBooks) with **real-time sync** triggered on entity create/update. QuickBooks Desktop support is deferred to a future phase.

**Entities synced:** Customers, Invoices, Payments, Pricebook Items, Estimates

**No new npm packages required** — uses Node.js `crypto` for token encryption and native `fetch` for the QBO REST API.

---

## Phase 1: Infrastructure

### 1A. Database Schema

**New file:** `packages/shared/src/db/schema/quickbooks.ts`

Three new tables in the `fieldservice` schema:

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `qb_connections` | Per-tenant OAuth credentials | `tenantId` (unique), `realmId`, `accessToken` (encrypted), `refreshToken` (encrypted), `accessTokenExpiresAt`, `refreshTokenExpiresAt`, `companyName`, `isActive`, `connectedBy` |
| `qb_entity_mappings` | Local ID ↔ QB ID mapping | `tenantId`, `entityType`, `localEntityId`, `qbEntityId`, `qbSyncToken`, `lastSyncStatus`, `lastSyncError` |
| `qb_sync_log` | Audit trail | `tenantId`, `entityType`, `localEntityId`, `qbEntityId`, `operation`, `status`, `requestPayload`, `responsePayload`, `errorMessage`, `durationMs` |

**Modify:** `packages/shared/src/db/schema/index.ts` — add `export * from "./quickbooks"`

### 1B. Environment Variables

**Modify:** `apps/back/.env.example` — add:
```
QB_CLIENT_ID=
QB_CLIENT_SECRET=
QB_REDIRECT_URI=http://localhost:3200/api/v1/integrations/quickbooks/callback
QB_ENVIRONMENT=sandbox
QB_TOKEN_ENCRYPTION_KEY=   # 32 bytes as 64-char hex string
```

### 1C. Token Encryption

**New file:** `apps/back/src/lib/quickbooks/encryption.ts`
- `encryptToken(plaintext)` / `decryptToken(ciphertext)` using AES-256-GCM
- IV randomly generated per encryption, stored as `iv:authTag:ciphertext`

### 1D. QB API Types

**New file:** `apps/back/src/lib/quickbooks/types.ts`
- TypeScript interfaces for QBO API entities: `QBCustomer`, `QBInvoice`, `QBPayment`, `QBItem`, `QBEstimate`
- Create/update input types for each
- Response wrapper types

### 1E. QBO REST Client

**New file:** `apps/back/src/lib/quickbooks/client.ts`

Core HTTP client wrapping the QBO REST API:
- **Auto token refresh:** checks `accessTokenExpiresAt` before each request, refreshes if within 5 min of expiry
- **Retry:** on 401 refresh+retry once, on 429 respect `Retry-After`, max 3 retries
- **Rate limiting:** simple in-memory counter (500 req/min per realm)
- **All requests logged** to `qb_sync_log`
- **Errors** wrapped in `QBApiError extends AppError`

### 1F. OAuth 2.0 Flow

**New file:** `apps/back/src/lib/quickbooks/oauth.ts`
- `getAuthorizationUrl(tenantId, csrfState)` — builds Intuit OAuth URL with `com.intuit.quickbooks.accounting` scope
- `exchangeCodeForTokens(code, realmId)` — POST to Intuit token endpoint
- `disconnectCompany(tenantId)` — revoke tokens + mark connection inactive

**New API routes:**

| Route | Method | Purpose |
|-------|--------|---------|
| `api/v1/integrations/quickbooks/connect/route.ts` | GET | Generate OAuth URL, set CSRF cookie, redirect |
| `api/v1/integrations/quickbooks/callback/route.ts` | GET | Handle OAuth redirect, exchange code, store tokens, redirect to settings |
| `api/v1/integrations/quickbooks/disconnect/route.ts` | POST | Revoke tokens, deactivate connection |
| `api/v1/integrations/quickbooks/status/route.ts` | GET | Return connection status + sync stats |

### 1G. RBAC Update

**Modify:** `apps/back/src/lib/auth/permissions.ts`
- Add `"integrations"` to `Resource` type union
- `admin`: `["create", "read", "update", "delete", "manage"]`
- `office_manager`: `["read", "manage"]`
- Other roles: no access

### 1H. Tenant Settings Extension

**Modify:** `packages/shared/src/db/schema/tenants.ts` — extend `TenantSettings`:
```typescript
quickbooks?: {
  incomeAccountId?: string;    // QB account for service income
  expenseAccountId?: string;   // QB account for expenses
  taxStrategy?: "global" | "per_line" | "none";
  syncEstimates?: boolean;
  defaultPaymentMethodId?: string;
};
```

---

## Phase 2: Entity Sync

### 2A. Data Mappers

**New file:** `apps/back/src/lib/quickbooks/mappers.ts`

| Mapper | SERVICE → QB |
|--------|-------------|
| `mapCustomerToQB` | firstName/lastName/company → DisplayName, email → PrimaryEmailAddr, phone → PrimaryPhone, primary property address → BillAddr |
| `mapPricebookItemToQB` | name/sku/description → Name/Sku/Description, type mapping (material→NonInventory, else→Service), unitPrice → UnitPrice |
| `mapInvoiceToQB` | invoiceNumber → DocNumber, line items → Line array with SalesItemLineDetail, customer ref, tax handling |
| `mapPaymentToQB` | amount → TotalAmt, linked to QB invoice, payment method mapping |
| `mapEstimateToQB` | estimateNumber → DocNumber, approved option's line items → Line array, customer ref |

### 2B. QuickBooks Sync Service

**New file:** `apps/back/src/lib/services/quickbooks.ts`

Main orchestration service:
- `isQBConnected(tenantId)` — fast check, returns boolean
- `getQBConnectionStatus(ctx)` — full status with stats for UI
- `syncCustomerToQB(tenantId, customerId)` — check mapping → create or update in QB → upsert mapping
- `syncInvoiceToQB(tenantId, invoiceId)` — resolve customer + item dependencies first → sync invoice
- `syncPaymentToQB(tenantId, paymentId)` — resolve customer + invoice dependencies → sync payment
- `syncPricebookItemToQB(tenantId, itemId)` — sync item with account ref
- `syncEstimateToQB(tenantId, estimateId)` — resolve customer + item dependencies → sync estimate
- `resyncEntity(ctx, entityType, localEntityId)` — manual re-sync action
- `listSyncLog(ctx, params)` / `getSyncStats(ctx)` — for UI

**Dependency resolution:** When syncing an invoice, the service automatically ensures the customer and any referenced pricebook items are synced to QB first (creating them if no mapping exists).

### 2C. Non-Blocking Sync Trigger

**New file:** `apps/back/src/lib/quickbooks/sync-trigger.ts`

```typescript
export function triggerQBSync(tenantId: string, entityType: string, entityId: string, op: "create" | "update"): void
```

- Bails immediately if `QB_CLIENT_ID` not configured
- Uses `setTimeout(..., 100)` to run after the DB transaction commits
- All errors caught internally — **never throws to caller**
- Logs failures to `qb_sync_log`

### 2D. Service Hooks (one-line additions)

**Modify each service** to add `triggerQBSync()` after `logActivity()`:

| File | After Functions |
|------|----------------|
| `apps/back/src/lib/services/customers.ts` | `createCustomer`, `updateCustomer` |
| `apps/back/src/lib/services/invoices.ts` | `createInvoice`, `updateInvoice`, `sendInvoice`, `voidInvoice`, `recordPayment` |
| `apps/back/src/lib/services/pricebook.ts` | create/update pricebook item |
| `apps/back/src/lib/services/estimates.ts` | create/update estimate |
| `apps/back/src/app/api/v1/webhooks/stripe/route.ts` | After recording Stripe payment |

---

## Phase 3: Settings UI

### 3A. Integrations Page

**Rewrite:** `apps/back/src/app/(dashboard)/settings/integrations/page.tsx`

Replace "Coming Soon" with integration cards layout. Shows a QuickBooks card with:
- **Disconnected:** QB logo, description, "Connect to QuickBooks" button
- **Connected:** Green badge, company name, last sync, error count, Disconnect/Configure buttons

**New file:** `apps/back/src/app/(dashboard)/settings/integrations/quickbooks-card.tsx`

### 3B. QuickBooks Configuration Page

**New file:** `apps/back/src/app/(dashboard)/settings/integrations/quickbooks/page.tsx`

- **Account Mapping:** dropdowns for QB income/expense accounts (fetched from QBO API)
- **Tax Strategy:** radio group (global/per-line/none)
- **Entity Toggles:** which entities to sync
- **Sync Overview:** recent sync stats, failed count with retry button

### 3C. Sync Log Page

**New file:** `apps/back/src/app/(dashboard)/settings/integrations/quickbooks/sync-log/page.tsx`

Paginated table with filters (entity type, status, date range), retry button for failed items, bulk "Retry All Failed"

### 3D. Server Actions

**New file:** `apps/back/src/actions/quickbooks.ts`
- `disconnectQuickBooksAction` / `updateQBSettingsAction` / `retryQBSyncAction` / `fetchQBAccountsAction`

### 3E. Manual Sync Buttons

Small additions to entity detail pages (customers, invoices, etc.) — a "Sync to QuickBooks" menu item visible only when QB is connected. Calls `retryQBSyncAction`.

---

## Phase 4: QuickBooks Desktop (Future — not in this implementation)

QB Desktop uses Web Connector (SOAP/XML polling). Would need:
- SOAP endpoint at `/api/v1/integrations/qbd/webconnector`
- QBXML mappers
- `xml2js` package
- Reuses `qb_entity_mappings` and `qb_sync_log` with `provider: "qbd"`

---

## File Summary

### New Files (16)

| # | File | Purpose |
|---|------|---------|
| 1 | `packages/shared/src/db/schema/quickbooks.ts` | DB schema (3 tables) |
| 2 | `apps/back/src/lib/quickbooks/encryption.ts` | Token encryption |
| 3 | `apps/back/src/lib/quickbooks/types.ts` | QB API type definitions |
| 4 | `apps/back/src/lib/quickbooks/client.ts` | QBO REST client |
| 5 | `apps/back/src/lib/quickbooks/oauth.ts` | OAuth 2.0 helpers |
| 6 | `apps/back/src/lib/quickbooks/mappers.ts` | SERVICE → QB data mappers |
| 7 | `apps/back/src/lib/quickbooks/sync-trigger.ts` | Non-blocking sync dispatcher |
| 8 | `apps/back/src/lib/services/quickbooks.ts` | Sync orchestration service |
| 9 | `apps/back/src/app/api/v1/integrations/quickbooks/connect/route.ts` | OAuth initiate |
| 10 | `apps/back/src/app/api/v1/integrations/quickbooks/callback/route.ts` | OAuth callback |
| 11 | `apps/back/src/app/api/v1/integrations/quickbooks/disconnect/route.ts` | Disconnect |
| 12 | `apps/back/src/app/api/v1/integrations/quickbooks/status/route.ts` | Status endpoint |
| 13 | `apps/back/src/actions/quickbooks.ts` | Server actions for UI |
| 14 | `apps/back/src/app/(dashboard)/settings/integrations/quickbooks-card.tsx` | Integration card |
| 15 | `apps/back/src/app/(dashboard)/settings/integrations/quickbooks/page.tsx` | Config page |
| 16 | `apps/back/src/app/(dashboard)/settings/integrations/quickbooks/sync-log/page.tsx` | Sync log page |

### Modified Files (8)

| # | File | Change |
|---|------|--------|
| 1 | `packages/shared/src/db/schema/index.ts` | Add quickbooks export |
| 2 | `packages/shared/src/db/schema/tenants.ts` | Extend `TenantSettings` with `quickbooks` config |
| 3 | `apps/back/src/lib/auth/permissions.ts` | Add `"integrations"` resource |
| 4 | `apps/back/src/lib/services/customers.ts` | Add `triggerQBSync` calls |
| 5 | `apps/back/src/lib/services/invoices.ts` | Add `triggerQBSync` calls |
| 6 | `apps/back/src/lib/services/pricebook.ts` | Add `triggerQBSync` calls |
| 7 | `apps/back/src/lib/services/estimates.ts` | Add `triggerQBSync` calls |
| 8 | `apps/back/src/app/(dashboard)/settings/integrations/page.tsx` | Replace placeholder |

---

## Edge Cases & Mitigations

| Issue | Mitigation |
|-------|------------|
| QB `DisplayName` uniqueness conflict | Catch duplicate name error, append customer ID suffix, retry |
| Concurrent token refresh race | PostgreSQL advisory lock during refresh |
| Invoice sync without customer in QB | Auto-sync customer dependency first |
| Ad-hoc line items (no pricebook item) | Map to generic "Services" QB item or use description-only line |
| Soft-deleted entities | Update QB entity to `Active: false` |
| Initial bulk sync on connect | "Sync All Existing" button with batched processing + progress indicator |

## Verification

1. **Schema:** Run `pnpm db:push` from `apps/back/` to create the 3 new tables
2. **OAuth:** Set QB sandbox credentials in `.env.local`, click "Connect to QuickBooks" in settings, complete OAuth flow, verify `qb_connections` row created
3. **Sync:** Create a customer in SERVICE, verify it appears in QBO sandbox, check `qb_entity_mappings` and `qb_sync_log`
4. **Invoice flow:** Create invoice → send → record payment → verify all 3 entities synced to QBO
5. **Token refresh:** Wait for access token to expire, trigger a sync, verify auto-refresh works
6. **Error handling:** Disconnect QB sandbox network, trigger a sync, verify graceful failure + error logged
7. **Typecheck:** `pnpm typecheck` passes
