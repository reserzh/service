import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { getTenantSettings, updateTenantSettings } from "@/lib/services/settings";
import { handleApiError } from "@/lib/api/errors";

const businessHoursEntry = z.union([
  z.object({ open: z.string(), close: z.string() }),
  z.null(),
]);

const updateSettingsSchema = z.object({
  defaultTaxRate: z.number().min(0).max(1).optional(),
  businessHours: z.record(z.string(), businessHoursEntry).optional(),
  invoiceTerms: z.string().max(2000).optional(),
  estimateTerms: z.string().max(2000).optional(),
  invoicePrefix: z.string().max(20).optional(),
  estimatePrefix: z.string().max(20).optional(),
  jobPrefix: z.string().max(20).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const data = await getTenantSettings(ctx);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const body = await req.json();
    const input = updateSettingsSchema.parse(body);
    const data = await updateTenantSettings(ctx, input as Parameters<typeof updateTenantSettings>[1]);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
