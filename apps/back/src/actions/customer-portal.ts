"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import {
  inviteCustomerToPortal,
  revokePortalAccess,
} from "@/lib/services/customer-portal";
import { getActionErrorMessage } from "@/lib/api/errors";

export async function inviteCustomerAction(
  customerId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const ctx = await requireAuth();
    await inviteCustomerToPortal(ctx, customerId);

    revalidatePath("/customers");
    revalidatePath(`/customers/${customerId}`);

    return { success: true };
  } catch (error) {
    return {
      error: getActionErrorMessage(
        error,
        "Failed to invite customer to portal."
      ),
    };
  }
}

export async function revokePortalAccessAction(
  customerId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const ctx = await requireAuth();
    await revokePortalAccess(ctx, customerId);

    revalidatePath("/customers");
    revalidatePath(`/customers/${customerId}`);

    return { success: true };
  } catch (error) {
    return {
      error: getActionErrorMessage(
        error,
        "Failed to revoke portal access."
      ),
    };
  }
}
