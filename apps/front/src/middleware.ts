import { NextRequest, NextResponse } from "next/server";

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "yourplatform.com";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  // Skip static files and internal Next.js routes
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  let tenantSlug: string | null = null;
  let customDomain: string | null = null;

  // Check if this is a subdomain of the platform
  if (hostname.endsWith(`.${PLATFORM_DOMAIN}`)) {
    tenantSlug = hostname.replace(`.${PLATFORM_DOMAIN}`, "");
  } else if (hostname === PLATFORM_DOMAIN || hostname === `www.${PLATFORM_DOMAIN}`) {
    // Main platform domain — no tenant
    return new NextResponse("Platform homepage", { status: 200 });
  } else if (hostname === "localhost:3001" || hostname === "localhost") {
    // Local dev — use x-tenant-slug header or query param for testing
    tenantSlug = request.headers.get("x-tenant-slug") || url.searchParams.get("tenant") || "demo";
  } else {
    // Custom domain
    customDomain = hostname.replace(/^www\./, "");
  }

  const response = NextResponse.next();

  if (tenantSlug) {
    response.headers.set("x-tenant-slug", tenantSlug);
  }
  if (customDomain) {
    response.headers.set("x-custom-domain", customDomain);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
