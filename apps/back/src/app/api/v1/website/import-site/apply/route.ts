import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { handleApiError } from "@/lib/api/errors";
import { applyImport } from "@/lib/services/website-importer";
import type { SiteImportPreview } from "@/lib/services/website-importer";

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    assertPermission(ctx, "website", "create");

    const body = await req.json();
    const { preview, applyTheme, applyBranding } = body as {
      preview?: SiteImportPreview;
      applyTheme?: boolean;
      applyBranding?: boolean;
    };

    if (!preview || !preview.pages) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Preview data is required",
          },
        },
        { status: 400 }
      );
    }

    const result = await applyImport(ctx, preview, {
      applyTheme: applyTheme ?? false,
      applyBranding: applyBranding ?? false,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
