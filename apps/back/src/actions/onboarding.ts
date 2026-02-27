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

    // 1. Update tenant settings with trade + operator type
    await updateTenantSettings(ctx, {
      tradeType: input.tradeType,
      operatorType: input.operatorType,
    });

    // 2. Create first customer if provided
    if (input.customer) {
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
    }

    // 3. Create pricebook items from selected services
    for (const service of input.services) {
      await createPricebookItem(ctx, {
        name: service.name,
        unitPrice: service.unitPrice,
        type: "service",
      });
    }

    // 4. Mark onboarding as completed
    await db
      .update(tenants)
      .set({ onboardingCompleted: true, updatedAt: new Date() })
      .where(eq(tenants.id, ctx.tenantId));

    return {};
  } catch (error) {
    console.error("[Onboarding] Failed:", error);
    return { error: "Failed to complete onboarding. Please try again." };
  }
}
