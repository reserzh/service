import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { createApiClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { jobPhotos, jobs } from "@fieldservice/shared/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { handleApiError, NotFoundError } from "@/lib/api/errors";
import { randomUUID } from "crypto";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;

    const photos = await db
      .select()
      .from(jobPhotos)
      .where(and(eq(jobPhotos.jobId, id), eq(jobPhotos.tenantId, ctx.tenantId)))
      .orderBy(desc(jobPhotos.createdAt));

    return NextResponse.json({ data: photos });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id: jobId } = await context.params;

    // Verify job exists and belongs to tenant
    const [job] = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, ctx.tenantId)))
      .limit(1);

    if (!job) throw new NotFoundError("Job");

    const formData = await req.formData();
    const file = formData.get("photo") as File | null;
    const caption = (formData.get("caption") as string) || null;

    if (!file) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Photo file is required" } },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const fileExt = file.name?.split(".").pop() || "jpg";
    const fileName = `${randomUUID()}.${fileExt}`;
    const storagePath = `${ctx.tenantId}/${jobId}/${fileName}`;

    const supabase = await createApiClient(req);
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("job-photos")
      .upload(storagePath, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: { code: "UPLOAD_ERROR", message: "Failed to upload photo" } },
        { status: 500 }
      );
    }

    // Insert DB record
    const [photo] = await db
      .insert(jobPhotos)
      .values({
        tenantId: ctx.tenantId,
        jobId,
        userId: ctx.userId,
        storagePath,
        caption,
        takenAt: new Date(),
      })
      .returning();

    return NextResponse.json({ data: photo }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
