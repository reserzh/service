import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { createApiClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { jobPhotos } from "@fieldservice/shared/db/schema";
import { eq, and } from "drizzle-orm";
import { handleApiError, NotFoundError } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ id: string; photoId: string }>;
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id: jobId, photoId } = await context.params;

    // Find the photo
    const [photo] = await db
      .select()
      .from(jobPhotos)
      .where(
        and(
          eq(jobPhotos.id, photoId),
          eq(jobPhotos.jobId, jobId),
          eq(jobPhotos.tenantId, ctx.tenantId)
        )
      )
      .limit(1);

    if (!photo) throw new NotFoundError("Photo");

    // Delete from Storage
    const supabase = await createApiClient(req);
    await supabase.storage.from("job-photos").remove([photo.storagePath]);

    // Delete DB record
    await db
      .delete(jobPhotos)
      .where(
        and(
          eq(jobPhotos.id, photoId),
          eq(jobPhotos.tenantId, ctx.tenantId)
        )
      );

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
