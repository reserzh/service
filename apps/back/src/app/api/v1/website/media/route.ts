import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { handleApiError } from "@/lib/api/errors";
import { listMedia, createMedia } from "@/lib/services/website";
import { createApiClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const media = await listMedia(ctx);
    return NextResponse.json({ data: media });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    assertPermission(ctx, "website", "update");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const altText = (formData.get("altText") as string) || undefined;

    if (!file) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "File is required" } },
        { status: 400 }
      );
    }

    // Validate file type
    const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "pdf"];
    const ALLOWED_MIME_TYPES = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    const fileExt = (file.name?.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: `File type not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(", ")}` } },
        { status: 400 }
      );
    }

    if (!file.type || !ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid file MIME type." } },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "File too large. Maximum size is 10MB." } },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const fileName = `${randomUUID()}.${fileExt}`;
    const storagePath = `${ctx.tenantId}/${fileName}`;

    const supabase = await createApiClient(req);
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("site-media")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: { code: "UPLOAD_ERROR", message: "Failed to upload file" } },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("site-media")
      .getPublicUrl(storagePath);

    // Create DB record
    const media = await createMedia(ctx, {
      filename: file.name,
      storagePath,
      url: urlData.publicUrl,
      mimeType: file.type,
      sizeBytes: file.size,
      altText,
    });

    return NextResponse.json({ data: media }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
