import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS, getClientIp } from "@/lib/rate-limit";

/**
 * Proxies accept-invite requests to the back app, which holds the
 * SUPABASE_SERVICE_ROLE_KEY. This keeps the service role key out of
 * the front app's environment.
 */
export async function POST(req: NextRequest) {
  try {
    // Origin validation: ensure request comes from our own domain
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host && !origin.includes(host.split(":")[0])) {
      return NextResponse.json(
        { error: { message: "Invalid request origin." } },
        { status: 403 }
      );
    }

    // Rate limit: 5 invite attempts per minute per IP (brute-force protection)
    const ip = getClientIp(req);
    const rl = checkRateLimit(`portal-invite:${ip}`, RATE_LIMITS.portalInvite);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: { message: "Too many attempts. Please try again shortly." } },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
      );
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:3200";
    const body = await req.json();

    const res = await fetch(`${backendUrl}/api/v1/portal/accept-invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Accept invite proxy error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: { message: "Failed to process invitation." } },
      { status: 500 }
    );
  }
}
