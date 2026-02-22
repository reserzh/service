import { db } from "@/lib/db";
import { customers, customerPortalTokens } from "@fieldservice/shared/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { logActivity } from "./activity";
import { AppError, NotFoundError } from "@/lib/api/errors";
import { createClient } from "@supabase/supabase-js";

// ---------- Helpers ----------

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new AppError(
      "CONFIG_ERROR",
      "Supabase admin credentials are not configured.",
      500
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ---------- Invite ----------

export async function inviteCustomerToPortal(
  ctx: UserContext,
  customerId: string
) {
  assertPermission(ctx, "portal", "manage");

  // Fetch customer (tenant-scoped, not deleted)
  const [customer] = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.id, customerId),
        eq(customers.tenantId, ctx.tenantId),
        isNull(customers.deletedAt)
      )
    )
    .limit(1);

  if (!customer) {
    throw new NotFoundError("Customer");
  }

  if (!customer.email) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Customer must have an email address to be invited to the portal.",
      400
    );
  }

  if (customer.portalAccessEnabled) {
    throw new AppError(
      "CONFLICT",
      "Customer already has portal access enabled.",
      409
    );
  }

  // Create Supabase auth user for the customer (if not already created)
  const supabase = getSupabaseAdmin();
  let supabaseUserId = customer.supabaseUserId;

  if (!supabaseUserId) {
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: customer.email,
        email_confirm: true,
        user_metadata: {
          portal_customer: true,
          tenant_id: ctx.tenantId,
          customer_id: customerId,
        },
      });

    if (authError) {
      throw new AppError(
        "AUTH_ERROR",
        `Failed to create portal user: ${authError.message}`,
        500
      );
    }

    supabaseUserId = authUser.user.id;
  }

  // Generate invite token
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(customerPortalTokens).values({
    tenantId: ctx.tenantId,
    customerId,
    token,
    type: "invite",
    expiresAt,
  });

  // Update customer record
  const [updated] = await db
    .update(customers)
    .set({
      supabaseUserId,
      portalAccessEnabled: true,
      invitedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(eq(customers.id, customerId), eq(customers.tenantId, ctx.tenantId))
    )
    .returning();

  await logActivity(ctx, "customer", customerId, "portal_invited", {
    email: customer.email,
  });

  return { customer: updated, token };
}

// ---------- Verify Token ----------

export async function verifyPortalToken(token: string) {
  const [tokenRecord] = await db
    .select()
    .from(customerPortalTokens)
    .where(eq(customerPortalTokens.token, token))
    .limit(1);

  if (!tokenRecord) {
    throw new AppError("INVALID_TOKEN", "Invalid or expired token.", 400);
  }

  if (tokenRecord.usedAt) {
    throw new AppError("INVALID_TOKEN", "This token has already been used.", 400);
  }

  if (new Date() > tokenRecord.expiresAt) {
    throw new AppError("INVALID_TOKEN", "This token has expired.", 400);
  }

  // Fetch associated customer
  const [customer] = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.id, tokenRecord.customerId),
        eq(customers.tenantId, tokenRecord.tenantId),
        isNull(customers.deletedAt)
      )
    )
    .limit(1);

  if (!customer) {
    throw new NotFoundError("Customer");
  }

  if (!customer.portalAccessEnabled) {
    throw new AppError(
      "ACCESS_REVOKED",
      "Portal access has been revoked for this customer.",
      403
    );
  }

  // Mark token as used
  await db
    .update(customerPortalTokens)
    .set({ usedAt: new Date() })
    .where(eq(customerPortalTokens.id, tokenRecord.id));

  return {
    customerId: customer.id,
    tenantId: customer.tenantId,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    supabaseUserId: customer.supabaseUserId,
  };
}

// ---------- Revoke ----------

export async function revokePortalAccess(
  ctx: UserContext,
  customerId: string
) {
  assertPermission(ctx, "portal", "manage");

  const [customer] = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.id, customerId),
        eq(customers.tenantId, ctx.tenantId),
        isNull(customers.deletedAt)
      )
    )
    .limit(1);

  if (!customer) {
    throw new NotFoundError("Customer");
  }

  if (!customer.portalAccessEnabled) {
    throw new AppError(
      "INVALID_STATE",
      "Portal access is not currently enabled for this customer.",
      422
    );
  }

  // Disable portal access on customer record
  const [updated] = await db
    .update(customers)
    .set({
      portalAccessEnabled: false,
      updatedAt: new Date(),
    })
    .where(
      and(eq(customers.id, customerId), eq(customers.tenantId, ctx.tenantId))
    )
    .returning();

  await logActivity(ctx, "customer", customerId, "portal_revoked");

  return updated;
}
