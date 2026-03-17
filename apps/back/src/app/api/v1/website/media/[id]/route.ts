import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { handleApiError, validateUUID } from "@/lib/api/errors";
import { deleteMedia } from "@/lib/services/website";
import { createApiClient } from "@/lib/supabase/server";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiAuth(req);
    assertPermission(ctx, "website", "delete");
    const { id } = await params;
    validateUUID(id);

    const deleted = await deleteMedia(ctx, id);

    // Remove file from Supabase Storage
    if (deleted.storagePath) {
      const supabase = await createApiClient(req);
      await supabase.storage.from("site-media").remove([deleted.storagePath]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
