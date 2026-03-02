import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXT_PUBLIC_SUPABASE_URL: z.url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  // Server-side Supabase URL (e.g. host.docker.internal) — falls back to NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_URL: z.url().optional(),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const messages = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Missing or invalid environment variables:\n${messages}`);
  }
  const publicHost = new URL(result.data.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
  return {
    ...result.data,
    /** Use this for server-side Supabase calls (resolves inside Docker) */
    SUPABASE_SERVER_URL: result.data.SUPABASE_URL ?? result.data.NEXT_PUBLIC_SUPABASE_URL,
    /** Cookie name matching the browser client (derived from public URL) */
    SUPABASE_COOKIE_NAME: `sb-${publicHost}-auth-token`,
  };
}

let _env: ReturnType<typeof validateEnv> | undefined;

export const env = new Proxy({} as ReturnType<typeof validateEnv>, {
  get(_target, prop) {
    if (!_env) _env = validateEnv();
    return _env[prop as keyof typeof _env];
  },
});
