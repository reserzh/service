"use server";

import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import {
  createCustomReport,
  updateCustomReport,
  deleteCustomReport,
} from "@/lib/services/custom-reports";
import { revalidatePath } from "next/cache";

export async function saveCustomReportAction(data: {
  title: string;
  description?: string;
  reportConfig: {
    charts: Array<{
      type: "bar" | "line" | "area" | "pie";
      title: string;
      xKey?: string;
      yKey?: string;
      nameKey?: string;
      valueKey?: string;
      data: Record<string, unknown>[];
    }>;
    tables: Array<{
      title: string;
      columns: string[];
      rows: string[][];
    }>;
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
  if (!hasPermission(ctx.role, "reports", "read")) {
    return { error: "No permission to access reports." };
  }

  try {
    const report = await createCustomReport(ctx, data);
    revalidatePath("/reports");
    revalidatePath("/reports/custom");
    return { success: true, reportId: report.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save report." };
  }
}

export async function updateCustomReportAction(
  id: string,
  updates: {
    title?: string;
    description?: string;
    reportConfig?: {
      charts: Array<{
        type: "bar" | "line" | "area" | "pie";
        title: string;
        xKey?: string;
        yKey?: string;
        nameKey?: string;
        valueKey?: string;
        data: Record<string, unknown>[];
      }>;
      tables: Array<{
        title: string;
        columns: string[];
        rows: string[][];
      }>;
    };
    cachedData?: Record<string, unknown>;
  }
) {
  const ctx = await requireAuth();
  try {
    const report = await updateCustomReport(ctx, id, updates);
    if (!report) return { error: "Report not found." };
    revalidatePath(`/reports/custom/${id}`);
    revalidatePath("/reports/custom");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update report." };
  }
}

export async function deleteCustomReportAction(id: string) {
  const ctx = await requireAuth();
  await deleteCustomReport(ctx, id);
  revalidatePath("/reports/custom");
  revalidatePath("/reports");
  return { success: true };
}
