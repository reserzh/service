import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { generateTheme, validateExternalUrl } from "@/lib/services/theme-generator";
import type { SiteTheme } from "@fieldservice/shared/types";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_LOGO_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_URLS = 3;

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);

    const formData = await req.formData();

    // Parse fields
    const description = (formData.get("description") as string) || undefined;
    const inspirationUrlsRaw = formData.get("inspirationUrls") as string | null;
    const logo = formData.get("logo") as File | null;
    const refinementPrompt =
      (formData.get("refinementPrompt") as string) || undefined;
    const previousResultRaw = formData.get("previousResult") as string | null;

    // Validate description
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`,
          },
        },
        { status: 400 }
      );
    }

    // Validate refinement prompt
    if (refinementPrompt && refinementPrompt.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: `Refinement prompt must be ${MAX_DESCRIPTION_LENGTH} characters or less`,
          },
        },
        { status: 400 }
      );
    }

    // Parse inspiration URLs
    let inspirationUrls: string[] | undefined;
    if (inspirationUrlsRaw) {
      try {
        inspirationUrls = JSON.parse(inspirationUrlsRaw) as string[];
        if (!Array.isArray(inspirationUrls)) {
          throw new Error("Not an array");
        }
        if (inspirationUrls.length > MAX_URLS) {
          return NextResponse.json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: `Maximum ${MAX_URLS} inspiration URLs allowed`,
              },
            },
            { status: 400 }
          );
        }
        // Validate each URL
        for (const url of inspirationUrls) {
          try {
            new URL(url);
          } catch {
            return NextResponse.json(
              {
                error: {
                  code: "VALIDATION_ERROR",
                  message: "One of the provided inspiration URLs is invalid",
                },
              },
              { status: 400 }
            );
          }
        }
      } catch {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "inspirationUrls must be a valid JSON array of URLs",
            },
          },
          { status: 400 }
        );
      }
    }

    // Parse previous result for refinement
    let previousResult: SiteTheme | undefined;
    if (previousResultRaw) {
      try {
        previousResult = JSON.parse(previousResultRaw) as SiteTheme;
      } catch {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "previousResult must be valid JSON",
            },
          },
          { status: 400 }
        );
      }
    }

    // Validate logo (file upload or existing URL)
    let logoBase64: string | undefined;
    let logoMediaType: string | undefined;
    const logoUrlField = (formData.get("logoUrl") as string) || undefined;

    if (logo) {
      if (!ALLOWED_IMAGE_TYPES.includes(logo.type)) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: `Logo must be JPEG, PNG, or WebP`,
            },
          },
          { status: 400 }
        );
      }
      if (logo.size > MAX_LOGO_SIZE) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Logo must be under 10MB",
            },
          },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await logo.arrayBuffer());
      logoBase64 = buffer.toString("base64");
      logoMediaType = logo.type;
    } else if (logoUrlField) {
      // Fetch existing logo from URL (SSRF-protected)
      try {
        await validateExternalUrl(logoUrlField);
        const logoRes = await fetch(logoUrlField, { signal: AbortSignal.timeout(5000) });
        if (logoRes.ok) {
          const contentType = logoRes.headers.get("content-type") || "";
          if (ALLOWED_IMAGE_TYPES.some((t) => contentType.includes(t))) {
            const buffer = Buffer.from(await logoRes.arrayBuffer());
            logoBase64 = buffer.toString("base64");
            logoMediaType = ALLOWED_IMAGE_TYPES.find((t) => contentType.includes(t));
          }
        }
      } catch {
        // Non-critical — proceed without logo
      }
    }

    // Validate at least one input
    const hasInput = description || inspirationUrls || logoBase64;
    const hasRefinement = refinementPrompt && previousResult;
    if (!hasInput && !hasRefinement) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message:
              "At least one input is required: description, inspiration URLs, logo, or refinement",
          },
        },
        { status: 400 }
      );
    }

    const result = await generateTheme(ctx, {
      description,
      inspirationUrls,
      logoBase64,
      logoMediaType,
      refinementPrompt,
      previousResult,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
