/**
 * Vercel Domains API integration for auto-provisioning custom domains.
 *
 * Requires environment variables:
 * - VERCEL_API_TOKEN: Vercel API token
 * - VERCEL_PROJECT_ID: The FRONT project ID on Vercel
 * - VERCEL_TEAM_ID: (optional) Vercel team ID
 *
 * When these env vars are not set, the functions gracefully no-op
 * so the system works without Vercel integration (e.g., in dev).
 */

const VERCEL_API_URL = "https://api.vercel.com";

function getVercelConfig() {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !projectId) return null;
  return { token, projectId, teamId };
}

function buildUrl(path: string, teamId?: string): string {
  const url = new URL(path, VERCEL_API_URL);
  if (teamId) url.searchParams.set("teamId", teamId);
  return url.toString();
}

/**
 * Add a custom domain to the Vercel project.
 * Returns true on success, false if Vercel integration is not configured.
 */
export async function addDomainToVercel(domain: string): Promise<boolean> {
  const config = getVercelConfig();
  if (!config) return false;

  const res = await fetch(
    buildUrl(`/v10/projects/${config.projectId}/domains`, config.teamId),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain }),
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    // Domain might already exist — that's OK
    if (data?.error?.code === "domain_already_in_use") return true;
    console.error("Vercel addDomain error:", data);
    return false;
  }

  return true;
}

/**
 * Remove a custom domain from the Vercel project.
 */
export async function removeDomainFromVercel(domain: string): Promise<boolean> {
  const config = getVercelConfig();
  if (!config) return false;

  const res = await fetch(
    buildUrl(`/v9/projects/${config.projectId}/domains/${domain}`, config.teamId),
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    // Domain might not exist — that's OK
    if (res.status === 404) return true;
    console.error("Vercel removeDomain error:", data);
    return false;
  }

  return true;
}

/**
 * Check domain configuration on Vercel (DNS status, SSL cert status).
 */
export async function getDomainConfigFromVercel(domain: string): Promise<{
  configured: boolean;
  misconfigured: boolean;
} | null> {
  const config = getVercelConfig();
  if (!config) return null;

  const res = await fetch(
    buildUrl(`/v6/domains/${domain}/config`, config.teamId),
    {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  return {
    configured: !data.misconfigured,
    misconfigured: data.misconfigured ?? false,
  };
}
