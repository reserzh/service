import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { isAIConfigured } from "@/lib/ai/client";
import { AIAssistantView } from "./ai-assistant-view";

export const metadata: Metadata = { title: "AI Assistant" };

export default async function AIAssistantPage() {
  const ctx = await requireAuth();

  if (!hasPermission(ctx.role, "ai_assistant", "read")) {
    redirect("/dashboard");
  }

  const configured = isAIConfigured();

  return (
    <AIAssistantView
      configured={configured}
      user={{ firstName: ctx.firstName, role: ctx.role }}
    />
  );
}
