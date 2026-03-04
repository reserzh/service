"use server";

import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import {
  saveUserDashboardLayout,
  createAIWidget,
  deleteAIWidget,
} from "@/lib/services/dashboard";
import { revalidatePath } from "next/cache";

export async function saveDashboardLayoutAction(
  widgetOrder: string[],
  widgetSizes: Record<string, "full" | "half">
) {
  const ctx = await requireAuth();
  await saveUserDashboardLayout(ctx, { widgetOrder, widgetSizes });
  revalidatePath("/dashboard");
  return { success: true };
}

export async function pinAIWidgetAction(data: {
  title: string;
  widgetConfig: {
    chartType: "bar" | "line" | "area" | "pie";
    xKey?: string;
    yKey?: string;
    nameKey?: string;
    valueKey?: string;
  };
  queryDefinition: {
    tools: Array<{ name: string; params: Record<string, unknown> }>;
    prompt: string;
  };
  cachedData?: Record<string, unknown>;
  conversationId?: string;
}) {
  const ctx = await requireAuth();
  if (!hasPermission(ctx.role, "ai_assistant", "read")) {
    return { error: "No permission to use AI features." };
  }

  try {
    const widget = await createAIWidget(ctx, data);
    revalidatePath("/dashboard");
    return { success: true, widgetId: widget.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to pin widget." };
  }
}

export async function removeAIWidgetAction(widgetId: string) {
  const ctx = await requireAuth();
  await deleteAIWidget(ctx, widgetId);
  revalidatePath("/dashboard");
  return { success: true };
}
