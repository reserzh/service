import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@fieldservice/shared/db/schema";
import { env } from "@/lib/env";

const globalForDb = globalThis as unknown as { db?: ReturnType<typeof drizzle> };

if (!globalForDb.db) {
  const client = postgres(env.DATABASE_URL, {
    prepare: false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  globalForDb.db = drizzle(client, { schema });
}

export const db = globalForDb.db;

export type Database = typeof db;
