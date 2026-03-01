import { db } from "@/lib/db";
import { qbConnections, qbSyncLog } from "@fieldservice/shared/db/schema";
import { eq, and } from "drizzle-orm";
import { encryptToken, decryptToken } from "./encryption";
import { AppError } from "@/lib/api/errors";
import type { QBErrorResponse } from "./types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const QB_BASE_URL: Record<string, string> = {
  sandbox: "https://sandbox-quickbooks.api.intuit.com",
  production: "https://quickbooks.api.intuit.com",
};

const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry
const MAX_RETRIES = 3;
const RATE_LIMIT_PER_MINUTE = 500;

// Simple in-memory rate limiter per realm
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

function getBaseUrl(): string {
  const env = process.env.QB_ENVIRONMENT ?? "sandbox";
  return QB_BASE_URL[env] ?? QB_BASE_URL.sandbox;
}

// ---------------------------------------------------------------------------
// QBApiError
// ---------------------------------------------------------------------------
export class QBApiError extends AppError {
  constructor(
    message: string,
    public qbCode?: string,
    public qbDetail?: string,
    statusCode = 400
  ) {
    super("QB_API_ERROR", message, statusCode);
    this.name = "QBApiError";
  }
}

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------
async function getConnection(tenantId: string) {
  const [conn] = await db
    .select()
    .from(qbConnections)
    .where(and(eq(qbConnections.tenantId, tenantId), eq(qbConnections.isActive, true)))
    .limit(1);

  if (!conn) {
    throw new QBApiError("QuickBooks is not connected", undefined, undefined, 400);
  }
  return conn;
}

async function refreshTokenIfNeeded(conn: Awaited<ReturnType<typeof getConnection>>): Promise<string> {

  const now = Date.now();
  const expiresAt = new Date(conn.accessTokenExpiresAt).getTime();

  if (now < expiresAt - TOKEN_REFRESH_BUFFER_MS) {
    return decryptToken(conn.accessToken);
  }

  // Refresh the token
  const clientId = process.env.QB_CLIENT_ID!;
  const clientSecret = process.env.QB_CLIENT_SECRET!;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: decryptToken(conn.refreshToken),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("QB token refresh failed:", res.status);

    // Mark connection inactive if refresh token expired
    if (res.status === 400 || res.status === 401) {
      await db
        .update(qbConnections)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(qbConnections.id, conn.id));
    }
    throw new QBApiError("Failed to refresh QuickBooks access token", undefined, body, 401);
  }

  const tokens = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    x_refresh_token_expires_in: number;
  };

  const accessTokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  const refreshTokenExpiresAt = new Date(
    Date.now() + tokens.x_refresh_token_expires_in * 1000
  );

  await db
    .update(qbConnections)
    .set({
      accessToken: encryptToken(tokens.access_token),
      refreshToken: encryptToken(tokens.refresh_token),
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      updatedAt: new Date(),
    })
    .where(eq(qbConnections.id, conn.id));

  return tokens.access_token;
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
function checkRateLimit(realmId: string): void {
  const now = Date.now();

  // Clean up expired entries to prevent memory leak
  for (const [key, val] of rateLimiter) {
    if (now > val.resetAt) rateLimiter.delete(key);
  }

  let entry = rateLimiter.get(realmId);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 60_000 };
    rateLimiter.set(realmId, entry);
  }

  if (entry.count >= RATE_LIMIT_PER_MINUTE) {
    throw new QBApiError("QuickBooks API rate limit exceeded. Try again shortly.", undefined, undefined, 429);
  }
  entry.count++;
}

// ---------------------------------------------------------------------------
// Core request method
// ---------------------------------------------------------------------------
export async function qbRequest<T>(
  tenantId: string,
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const conn = await getConnection(tenantId);
  checkRateLimit(conn.realmId);

  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/v3/company/${conn.realmId}${path}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const accessToken = await refreshTokenIfNeeded(conn);

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (res.ok) {
      return (await res.json()) as T;
    }

    // Handle 401 — token may have been refreshed by another request
    if (res.status === 401 && attempt < MAX_RETRIES - 1) {
      // Force a fresh token on next attempt
      continue;
    }

    // Handle 429 rate limit
    if (res.status === 429 && attempt < MAX_RETRIES - 1) {
      const retryAfter = parseInt(res.headers.get("Retry-After") ?? "5", 10);
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      continue;
    }

    // Parse QB error response
    const errorBody = (await res.json().catch(() => ({}))) as QBErrorResponse;
    const qbError = errorBody?.Fault?.Error?.[0];
    lastError = new QBApiError(
      qbError?.Message ?? `QuickBooks API error (${res.status})`,
      qbError?.code,
      qbError?.Detail,
      res.status
    );
  }

  throw lastError ?? new QBApiError("QuickBooks API request failed after retries");
}

// ---------------------------------------------------------------------------
// Convenience methods
// ---------------------------------------------------------------------------
export async function qbCreate<T>(
  tenantId: string,
  entityPath: string,
  data: unknown
): Promise<T> {
  return qbRequest<T>(tenantId, "POST", entityPath, data);
}

export async function qbUpdate<T>(
  tenantId: string,
  entityPath: string,
  data: unknown
): Promise<T> {
  return qbRequest<T>(tenantId, "POST", entityPath, data);
}

export async function qbQuery<T>(
  tenantId: string,
  query: string
): Promise<T> {
  const encoded = encodeURIComponent(query);
  return qbRequest<T>(tenantId, "GET", `/query?query=${encoded}`);
}

// ---------------------------------------------------------------------------
// Sync log helpers
// ---------------------------------------------------------------------------
export async function logSync(params: {
  tenantId: string;
  entityType: string;
  localEntityId: string;
  qbEntityId?: string;
  operation: string;
  status: string;
  requestPayload?: unknown;
  responsePayload?: unknown;
  errorMessage?: string;
  durationMs?: number;
}) {
  await db.insert(qbSyncLog).values({
    tenantId: params.tenantId,
    entityType: params.entityType,
    localEntityId: params.localEntityId,
    qbEntityId: params.qbEntityId ?? null,
    operation: params.operation,
    status: params.status,
    requestPayload: params.requestPayload ? JSON.stringify(params.requestPayload) : null,
    responsePayload: params.responsePayload ? JSON.stringify(params.responsePayload) : null,
    errorMessage: params.errorMessage ?? null,
    durationMs: params.durationMs ?? null,
  });
}
