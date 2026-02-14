import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { getSiteSettings, updateSiteSettings } from "@/lib/services/website";

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
    const result = await updateSiteSettings(ctx, body);
    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
