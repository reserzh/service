import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { customerPortalTokens, customers } from "@fieldservice/shared/db/schema";
import { handleApiError } from "@/lib/api/errors";
import { createClient } from "@supabase/supabase-js";

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin credentials are not configured");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = acceptInviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Invalid request data", issues: parsed.error.issues } },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    // Look up the token
    const [tokenRecord] = await db
      .select()
      .from(customerPortalTokens)
      .where(eq(customerPortalTokens.token, token))
      .limit(1);

    if (!tokenRecord) {
      return NextResponse.json(
        { error: { message: "Invalid or expired invitation link." } },
        { status: 400 }
      );
    }

    if (tokenRecord.usedAt) {
      return NextResponse.json(
        { error: { message: "This invitation has already been used." } },
        { status: 400 }
      );
    }

    if (new Date(tokenRecord.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: { message: "This invitation link has expired." } },
        { status: 400 }
      );
    }

    // Look up the customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, tokenRecord.customerId), eq(customers.tenantId, tokenRecord.tenantId)))
      .limit(1);

    if (!customer?.email) {
      return NextResponse.json(
        { error: { message: "Customer does not have an email address on file." } },
        { status: 400 }
      );
    }

    // Create auth user via Supabase admin
    const supabaseAdmin = getSupabaseAdmin();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: customer.email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "customer_portal",
        customer_id: customer.id,
        tenant_id: tokenRecord.tenantId,
      },
    });

    if (authError) {
      if (authError.message?.includes("already been registered")) {
        return NextResponse.json(
          { error: { message: "An account with this email already exists. Please sign in instead." } },
          { status: 409 }
        );
      }
      console.error("Supabase auth error: failed to create portal user");
      return NextResponse.json(
        { error: { message: "Failed to create account. Please try again." } },
        { status: 500 }
      );
    }

    // Update customer with supabase user ID and enable portal access
    await db
      .update(customers)
      .set({
        supabaseUserId: authData.user.id,
        portalAccessEnabled: true,
        updatedAt: new Date(),
      })
      .where(and(eq(customers.id, customer.id), eq(customers.tenantId, tokenRecord.tenantId)));

    // Mark token as used
    await db
      .update(customerPortalTokens)
      .set({ usedAt: new Date() })
      .where(eq(customerPortalTokens.id, tokenRecord.id));

    return NextResponse.json(
      { data: { email: customer.email, customerId: customer.id } },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
