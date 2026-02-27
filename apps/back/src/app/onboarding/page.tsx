import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tenants } from "@fieldservice/shared/db/schema";
import { eq } from "drizzle-orm";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata: Metadata = { title: "Get Started" };

export default async function OnboardingPage() {
  const ctx = await requireAuth();

  const tenant = await db
    .select({ onboardingCompleted: tenants.onboardingCompleted })
    .from(tenants)
    .where(eq(tenants.id, ctx.tenantId))
    .limit(1)
    .then((rows) => rows[0]);

  if (tenant?.onboardingCompleted) {
    redirect("/dashboard");
  }

  return <OnboardingWizard />;
}
