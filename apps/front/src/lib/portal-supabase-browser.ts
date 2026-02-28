import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Derive cookie name from the public URL to match the server-side client
const publicHost = new URL(supabaseUrl).hostname.split(".")[0];
const COOKIE_NAME = `sb-${publicHost}-auth-token`;

export function createPortalBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: { name: COOKIE_NAME },
  });
}
