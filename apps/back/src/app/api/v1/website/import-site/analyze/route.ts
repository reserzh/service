import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { handleApiError } from "@/lib/api/errors";
import { analyzePages } from "@/lib/services/website-importer";

const MAX_PAGES = 20;

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    assertPermission(ctx, "website", "create");

    const body = await req.json();
    const { url, selectedPages } = body as {
      url?: string;
      selectedPages?: string[];
    };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "URL is required" } },
        { status: 400 }
      );
    }

    if (
      !selectedPages ||
      !Array.isArray(selectedPages) ||
      selectedPages.length === 0
    ) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "At least one page must be selected",
          },
        },
        { status: 400 }
      );
    }

    if (selectedPages.length > MAX_PAGES) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: `Maximum ${MAX_PAGES} pages can be analyzed at once`,
          },
        },
        { status: 400 }
      );
    }

    // Validate each URL
    for (const pageUrl of selectedPages) {
      try {
        new URL(pageUrl);
      } catch {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "One of the provided page URLs is invalid",
            },
          },
          { status: 400 }
        );
      }
    }

    const result = await analyzePages(ctx, url, selectedPages);
    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
