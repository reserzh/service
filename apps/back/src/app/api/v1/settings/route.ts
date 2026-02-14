import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { getTenantSettings, updateTenantSettings } from "@/lib/services/settings";
import { handleApiError } from "@/lib/api/errors";

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
    const data = await updateTenantSettings(ctx, body);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
