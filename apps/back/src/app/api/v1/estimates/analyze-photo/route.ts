import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { analyzeAreaFromPhoto } from "@/lib/services/area-analysis";
import { handleApiError } from "@/lib/api/errors";
import { AppError } from "@/lib/api/errors";
import { isAIConfigured } from "@/lib/ai/client";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);

    if (!isAIConfigured()) {
      throw new AppError("AI_NOT_CONFIGURED", "AI features are not configured", 503);
    }

    const formData = await req.formData();
    const file = formData.get("photo") as File | null;
    const context = formData.get("context") as string | null;

    if (!file) {
      throw new AppError("VALIDATION_ERROR", "Photo file is required", 400);
    }

    // HEIC may come through as application/octet-stream from some devices
    const mimeType = file.type || "image/jpeg";
    const effectiveMime = mimeType === "application/octet-stream" ? "image/jpeg" : mimeType;

    if (!ALLOWED_TYPES.has(effectiveMime)) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Unsupported file type: ${effectiveMime}. Allowed: JPEG, PNG, WebP, HEIC`,
        400
      );
    }

    if (file.size > MAX_SIZE) {
      throw new AppError("VALIDATION_ERROR", "Photo must be under 20MB", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Convert HEIC to JPEG mime for the API (Claude doesn't support HEIC directly)
    const apiMimeType = effectiveMime === "image/heic" ? "image/jpeg" : effectiveMime;

    const result = await analyzeAreaFromPhoto(
      ctx,
      buffer,
      apiMimeType,
      context || undefined
    );

    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
