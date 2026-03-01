import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { qbConnections } from "@fieldservice/shared/db/schema";
import { eq, and } from "drizzle-orm";
import { encryptToken, decryptToken } from "./encryption";

const AUTHORIZATION_URL = "https://appcenter.intuit.com/connect/oauth2";
const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const REVOKE_URL = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";
const SCOPE = "com.intuit.quickbooks.accounting";

function getClientId(): string {
  const id = process.env.QB_CLIENT_ID;
  if (!id) throw new Error("QB_CLIENT_ID is not configured");
  return id;
}

function getClientSecret(): string {
  const secret = process.env.QB_CLIENT_SECRET;
  if (!secret) throw new Error("QB_CLIENT_SECRET is not configured");
  return secret;
}

function getRedirectUri(): string {
  return process.env.QB_REDIRECT_URI ?? "http://localhost:3200/api/v1/integrations/quickbooks/callback";
}

/**
 * Generate an OAuth 2.0 authorization URL for QuickBooks Online.
 * Returns { url, state } — state should be stored in a cookie for CSRF validation.
 */
export function getAuthorizationUrl(tenantId: string): {
  url: string;
  state: string;
} {
  const state = `${tenantId}:${randomBytes(16).toString("hex")}`;

  const params = new URLSearchParams({
    client_id: getClientId(),
    scope: SCOPE,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    state,
  });

  return {
    url: `${AUTHORIZATION_URL}?${params.toString()}`,
    state,
  };
}

/**
 * Exchange an authorization code for access/refresh tokens and store them.
 */
export async function exchangeCodeForTokens(
  code: string,
  realmId: string,
  tenantId: string,
  userId: string
): Promise<void> {
  const clientId = getClientId();
  const clientSecret = getClientSecret();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to exchange QB authorization code: ${body}`);
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

  // Fetch company info
  const env = process.env.QB_ENVIRONMENT ?? "sandbox";
  const baseUrl =
    env === "production"
      ? "https://quickbooks.api.intuit.com"
      : "https://sandbox-quickbooks.api.intuit.com";

  let companyName: string | null = null;
  try {
    const infoRes = await fetch(
      `${baseUrl}/v3/company/${realmId}/companyinfo/${realmId}`,
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: "application/json",
        },
      }
    );
    if (infoRes.ok) {
      const info = (await infoRes.json()) as {
        CompanyInfo: { CompanyName: string };
      };
      companyName = info.CompanyInfo.CompanyName;
    }
  } catch {
    // Non-critical — company name is optional
  }

  // Deactivate any existing connection for this tenant
  await db
    .update(qbConnections)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(qbConnections.tenantId, tenantId));

  // Insert new connection
  await db.insert(qbConnections).values({
    tenantId,
    realmId,
    accessToken: encryptToken(tokens.access_token),
    refreshToken: encryptToken(tokens.refresh_token),
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
    companyName,
    isActive: true,
    connectedBy: userId,
  });
}

/**
 * Revoke tokens and mark the connection as inactive.
 */
export async function disconnectCompany(tenantId: string): Promise<void> {
  const [conn] = await db
    .select()
    .from(qbConnections)
    .where(and(eq(qbConnections.tenantId, tenantId), eq(qbConnections.isActive, true)))
    .limit(1);

  if (!conn) return;

  // Attempt to revoke the refresh token with Intuit
  try {
    const clientId = getClientId();
    const clientSecret = getClientSecret();
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    await fetch(REVOKE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({ token: decryptToken(conn.refreshToken) }),
    });
  } catch {
    // Best effort — continue even if revocation fails
  }

  await db
    .update(qbConnections)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(qbConnections.id, conn.id));
}
