"use server";

import { requireAuth } from "@/lib/auth";
import { updateTenantSettings } from "@/lib/services/settings";
import { createCustomer } from "@/lib/services/customers";
import { createPricebookItem } from "@/lib/services/pricebook";
import { db } from "@/lib/db";
import { tenants } from "@fieldservice/shared/db/schema";
import { eq } from "drizzle-orm";

interface OnboardingInput {
  tradeType: string;
  operatorType: "solo" | "crew";
  customer?: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  services: Array<{
    name: string;
    unitPrice: number;
  }>;
}

export async function completeOnboardingAction(
  input: OnboardingInput
): Promise<{ error?: string }> {
  try {
    const ctx = await requireAuth();

    // 1. Mark onboarding as completed first — this is the critical update
    await db
      .update(tenants)
      .set({ onboardingCompleted: true, updatedAt: new Date() })
      .where(eq(tenants.id, ctx.tenantId));

    // 2. Update tenant settings with trade + operator type (best-effort)
    try {
      await updateTenantSettings(ctx, {
        tradeType: input.tradeType,
        operatorType: input.operatorType,
      });
    } catch (e) {
      console.error("[Onboarding] Settings update failed:", e);
    }

    // 3. Create first customer if provided (best-effort)
    if (input.customer) {
      try {
        await createCustomer(ctx, {
          firstName: input.customer.firstName,
          lastName: input.customer.lastName,
          phone: input.customer.phone,
          email: input.customer.email || undefined,
          property: input.customer.addressLine1
            ? {
                addressLine1: input.customer.addressLine1,
                addressLine2: "",
                city: input.customer.city || "",
                state: input.customer.state || "",
                zip: input.customer.zip || "",
              }
            : undefined,
        });
      } catch (e) {
        console.error("[Onboarding] Customer creation failed:", e);
      }
    }

    // 4. Create pricebook items from selected services (best-effort)
    for (const service of input.services) {
      try {
        await createPricebookItem(ctx, {
          name: service.name,
          unitPrice: service.unitPrice,
          type: "service",
        });
      } catch (e) {
        console.error("[Onboarding] Pricebook item failed:", e);
      }
    }

    return {};
  } catch (error) {
    console.error("[Onboarding] Failed:", error);
    return { error: "Failed to complete onboarding. Please try again." };
  }
}
