import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimitResponse(resetMs: number) {
  return NextResponse.json(
    { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(resetMs / 1000)) },
    }
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit auth endpoints (strictest)
  if (pathname.startsWith("/api/v1/auth/")) {
    const ip = getClientIp(request);
    const result = await checkRateLimit(`auth:${ip}`, RATE_LIMITS.auth);
    if (!result.allowed) return rateLimitResponse(result.resetMs);
  }

  // Rate limit public form submissions
  if (pathname.match(/^\/api\/v1\/public\/.*\/bookings/)) {
    const ip = getClientIp(request);
    const result = await checkRateLimit(`booking:${ip}`, RATE_LIMITS.publicForm);
    if (!result.allowed) return rateLimitResponse(result.resetMs);
  }

  // Rate limit public read endpoints (prevent tenant enumeration)
  if (pathname.startsWith("/api/v1/public/") && request.method === "GET") {
    const ip = getClientIp(request);
    const result = await checkRateLimit(`public-read:${ip}`, RATE_LIMITS.publicRead);
    if (!result.allowed) return rateLimitResponse(result.resetMs);
  }

  // General API rate limit
  if (pathname.startsWith("/api/v1/") && !pathname.startsWith("/api/v1/public/")) {
    const ip = getClientIp(request);
    const result = await checkRateLimit(`api:${ip}`, RATE_LIMITS.api);
    if (!result.allowed) return rateLimitResponse(result.resetMs);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
