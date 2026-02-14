import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { getCompanyProfile, updateCompanyProfile } from "@/lib/services/settings";
import { handleApiError } from "@/lib/api/errors";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const data = await getCompanyProfile(ctx);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).nullable().optional(),
  addressLine1: z.string().max(255).nullable().optional(),
  addressLine2: z.string().max(255).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(50).nullable().optional(),
  zip: z.string().max(20).nullable().optional(),
  timezone: z.string().max(50).optional(),
  website: z.string().max(255).nullable().optional(),
  licenseNumber: z.string().max(100).nullable().optional(),
  logoUrl: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const body = await req.json();
    const input = updateSchema.parse(body);
    const data = await updateCompanyProfile(ctx, input);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
