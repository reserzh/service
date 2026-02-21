import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { tenants, users } from "@fieldservice/shared/db/schema";
import { eq } from "drizzle-orm";
import { initializeSequences } from "@/lib/services/sequences";
import { handleApiError } from "@/lib/api/errors";
import { createApiClient } from "@/lib/supabase/server";

const registerSchema = z.object({
  companyName: z.string().min(1).max(255),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    // Verify the caller's Supabase JWT
    const supabase = await createApiClient(req);
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const input = registerSchema.parse(body);

    // Prevent duplicate registration -- check if user already has a record
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "User already registered" } },
        { status: 409 }
      );
    }

    // Generate slug from company name
    const slug = input.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100);

    // Create tenant and user in a transaction
    const result = await db.transaction(async (tx) => {
      // Create tenant
      const [tenant] = await tx
        .insert(tenants)
        .values({
          name: input.companyName,
          slug: `${slug}-${Date.now().toString(36)}`,
          email: input.email,
        })
        .returning();

      // Create admin user -- use the authenticated user's ID
      const [user] = await tx
        .insert(users)
        .values({
          id: authUser.id,
          tenantId: tenant.id,
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          role: "admin",
          canBeDispatched: false,
        })
        .returning();

      // Initialize sequences
      await initializeSequences(tenant.id);

      return { tenant, user };
    });

    return NextResponse.json(
      { data: { tenantId: result.tenant.id, userId: result.user.id } },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
