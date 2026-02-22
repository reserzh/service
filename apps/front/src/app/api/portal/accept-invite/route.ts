import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { customerPortalTokens, customers } from "@fieldservice/shared/db/schema";

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

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
    const tokenRecord = await db.query.customerPortalTokens.findFirst({
      where: eq(customerPortalTokens.token, token),
      with: { customer: true },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: { message: "Invalid or expired invitation link." } },
        { status: 400 }
      );
    }

    // Check if token is already used
    if (tokenRecord.usedAt) {
      return NextResponse.json(
        { error: { message: "This invitation has already been used." } },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date(tokenRecord.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: { message: "This invitation link has expired." } },
        { status: 400 }
      );
    }

    const customer = tokenRecord.customer;
    if (!customer.email) {
      return NextResponse.json(
        { error: { message: "Customer does not have an email address on file." } },
        { status: 400 }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create auth user
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
      // If user already exists, try to update their password instead
      if (authError.message?.includes("already been registered")) {
        return NextResponse.json(
          { error: { message: "An account with this email already exists. Please sign in instead." } },
          { status: 409 }
        );
      }
      console.error("Supabase auth error:", authError);
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
      .where(eq(customers.id, customer.id));

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
    console.error("Accept invite error:", error);
    return NextResponse.json(
      { error: { message: "Failed to process invitation." } },
      { status: 500 }
    );
  }
}
