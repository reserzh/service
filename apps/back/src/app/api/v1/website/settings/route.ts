import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { getSiteSettings, updateSiteSettings } from "@/lib/services/website";

const updateSiteSettingsSchema = z.object({
  isPublished: z.boolean().optional(),
  theme: z.record(z.string(), z.unknown()).optional(),
  branding: z.record(z.string(), z.unknown()).optional(),
  seoDefaults: z.record(z.string(), z.unknown()).optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
  analytics: z.record(z.string(), z.unknown()).optional(),
  customCss: z.string().max(50000).nullable().optional(),
  templateId: z.string().max(100).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const settings = await getSiteSettings(ctx);
    return NextResponse.json({ data: settings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const body = await req.json();
    const input = updateSiteSettingsSchema.parse(body);
    const result = await updateSiteSettings(ctx, input as Parameters<typeof updateSiteSettings>[1]);
    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
