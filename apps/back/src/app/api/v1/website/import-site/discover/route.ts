import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { handleApiError } from "@/lib/api/errors";
import { discoverPages } from "@/lib/services/website-importer";

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    assertPermission(ctx, "website", "create");

    const body = await req.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "URL is required" } },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid URL format" } },
        { status: 400 }
      );
    }

    const result = await discoverPages(ctx, url);
    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
