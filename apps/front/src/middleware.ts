import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "yourplatform.com";

export async function middleware(request: NextRequest) {
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

  // Portal paths — handle Supabase session refresh
  if (url.pathname.startsWith("/portal")) {
    return await handlePortalProxy(request);
  }

  let tenantSlug: string | null = null;
  let customDomain: string | null = null;

  // Query param or cookie override — works in all environments for easy tenant previewing
  const tenantParam = url.searchParams.get("tenant") || request.cookies.get("x-tenant-slug")?.value;

  if (tenantParam) {
    tenantSlug = tenantParam;
  } else if (hostname.endsWith(`.${PLATFORM_DOMAIN}`)) {
    tenantSlug = hostname.replace(`.${PLATFORM_DOMAIN}`, "");
  } else if (hostname === PLATFORM_DOMAIN || hostname === `www.${PLATFORM_DOMAIN}`) {
    // Main platform domain — no tenant
    return new NextResponse("Platform homepage", { status: 200 });
  } else if (hostname.startsWith("localhost")) {
    // Local dev — use header, cookie, or default
    tenantSlug =
      request.headers.get("x-tenant-slug") ||
      (process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "demo");
  } else {
    // Custom domain
    customDomain = hostname.replace(/^www\./, "");
  }

  const requestHeaders = new Headers(request.headers);
  if (tenantSlug) {
    requestHeaders.set("x-tenant-slug", tenantSlug);
  }
  if (customDomain) {
    requestHeaders.set("x-custom-domain", customDomain);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Persist tenant slug in a cookie so internal links work after ?tenant= override
  if (url.searchParams.get("tenant") && tenantSlug) {
    response.headers.set("Set-Cookie", `x-tenant-slug=${tenantSlug}; Path=/; SameSite=Lax`);
  }

  return response;
}

async function handlePortalProxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  // Derive cookie name from public URL so it matches the browser client
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl;
  const publicHost = new URL(publicUrl!).hostname.split(".")[0];
  const cookieName = `sb-${publicHost}-auth-token`;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: { name: cookieName },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh the session
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
