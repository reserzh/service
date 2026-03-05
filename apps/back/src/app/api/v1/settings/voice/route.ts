import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { assertPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { tenants } from "@fieldservice/shared/db/schema";
import { eq } from "drizzle-orm";
import type { TenantSettings } from "@fieldservice/shared/db/schema/tenants";

const updateSchema = z.object({
  twilioPhoneNumber: z.string().max(50).optional(),
  forwardingNumber: z.string().max(50).optional(),
  autoRecord: z.boolean().optional(),
  greetingMessage: z.string().max(500).optional(),
  voicemailEnabled: z.boolean().optional(),
  transcriptionEnabled: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    assertPermission(ctx, "settings", "read");

    const [tenant] = await db
      .select({ settings: tenants.settings })
      .from(tenants)
      .where(eq(tenants.id, ctx.tenantId))
      .limit(1);

    const settings = (tenant?.settings ?? {}) as TenantSettings;
    return NextResponse.json({ data: settings.voice ?? {} });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    assertPermission(ctx, "settings", "update");

    const body = await req.json();
    const input = updateSchema.parse(body);

    const [tenant] = await db
      .select({ settings: tenants.settings })
      .from(tenants)
      .where(eq(tenants.id, ctx.tenantId))
      .limit(1);

    const currentSettings = (tenant?.settings ?? {}) as TenantSettings;
    const updatedSettings: TenantSettings = {
      ...currentSettings,
      voice: {
        ...currentSettings.voice,
        ...input,
      },
    };

    await db
      .update(tenants)
      .set({ settings: updatedSettings, updatedAt: new Date() })
      .where(eq(tenants.id, ctx.tenantId));

    return NextResponse.json({ data: updatedSettings.voice });
  } catch (error) {
    return handleApiError(error);
  }
}
