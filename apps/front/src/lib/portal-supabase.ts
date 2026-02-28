import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side: prefer SUPABASE_URL (resolves inside Docker) over NEXT_PUBLIC_SUPABASE_URL
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Derive a consistent cookie name from the public URL so browser & server agree
const publicHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];
const COOKIE_NAME = `sb-${publicHost}-auth-token`;

export async function createPortalServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: { name: COOKIE_NAME },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from Server Component — middleware handles refresh
        }
      },
    },
  });
}
