import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@fieldservice/shared/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export type UserRole = "admin" | "office_manager" | "dispatcher" | "csr" | "technician";

export interface UserContext {
  userId: string;
  tenantId: string;
  role: UserRole;
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Get the current authenticated user context.
 * Redirects to login if not authenticated.
 * Use in Server Components and Server Actions.
 */
export async function requireAuth(): Promise<UserContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!dbUser || !dbUser.isActive) {
    redirect("/login");
  }

  return {
    userId: dbUser.id,
    tenantId: dbUser.tenantId,
    role: dbUser.role as UserRole,
    email: dbUser.email,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
  };
}

/**
 * Get the current authenticated user context for API routes.
 * Returns null if not authenticated (caller handles 401 response).
 */
export async function requireApiAuth(req: NextRequest): Promise<UserContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new ApiAuthError("Not authenticated");
  }

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!dbUser || !dbUser.isActive) {
    throw new ApiAuthError("User not found or inactive");
  }

  return {
    userId: dbUser.id,
    tenantId: dbUser.tenantId,
    role: dbUser.role as UserRole,
    email: dbUser.email,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
  };
}

export class ApiAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiAuthError";
  }
}

/**
 * Get optional auth context (returns null if not authenticated).
 * Use for pages that work both authenticated and unauthenticated.
 */
export async function getOptionalAuth(): Promise<UserContext | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!dbUser || !dbUser.isActive) return null;

    return {
      userId: dbUser.id,
      tenantId: dbUser.tenantId,
      role: dbUser.role as UserRole,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
    };
  } catch {
    return null;
  }
}
