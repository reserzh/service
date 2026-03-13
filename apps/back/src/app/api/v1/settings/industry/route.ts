import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { assertPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { tenants } from "@fieldservice/shared/db/schema";
import { eq } from "drizzle-orm";
import type { TenantSettings } from "@fieldservice/shared/db/schema/tenants";
import { TRADE_TYPES } from "@fieldservice/api-types/constants";

const updateSchema = z.object({
  tradeType: z.enum(TRADE_TYPES as unknown as [string, ...string[]]).optional(),
  operatorType: z.enum(["solo", "crew"]).optional(),
  landscaping: z
    .object({
      defaultServiceZones: z.array(z.string().max(100)).max(20).optional(),
      measurementUnit: z.enum(["sqft", "acre"]).optional(),
      seasonalScheduling: z.boolean().optional(),
    })
    .optional(),
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
    return NextResponse.json({
      data: {
        tradeType: settings.tradeType ?? "general",
        operatorType: settings.operatorType ?? "crew",
        landscaping: settings.landscaping ?? {},
      },
    });
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
      ...input as Partial<TenantSettings>,
    };

    await db
      .update(tenants)
      .set({ settings: updatedSettings, updatedAt: new Date() })
      .where(eq(tenants.id, ctx.tenantId));

    return NextResponse.json({
      data: {
        tradeType: updatedSettings.tradeType,
        operatorType: updatedSettings.operatorType,
        landscaping: updatedSettings.landscaping,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
