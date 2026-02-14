import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { createApiClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { jobSignatures, jobs } from "@fieldservice/shared/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { handleApiError, NotFoundError } from "@/lib/api/errors";
import { randomUUID } from "crypto";

const signatureSchema = z.object({
  base64: z.string().min(1),
  signerName: z.string().min(1).max(255),
  signerRole: z.enum(["customer", "technician"]),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;

    const signatures = await db
      .select()
      .from(jobSignatures)
      .where(and(eq(jobSignatures.jobId, id), eq(jobSignatures.tenantId, ctx.tenantId)))
      .orderBy(desc(jobSignatures.createdAt));

    return NextResponse.json({ data: signatures });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id: jobId } = await context.params;

    // Verify job exists
    const [job] = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, ctx.tenantId)))
      .limit(1);

    if (!job) throw new NotFoundError("Job");

    const body = await req.json();
    const input = signatureSchema.parse(body);

    // Convert base64 to buffer and upload to Storage
    const base64Data = input.base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const fileName = `${randomUUID()}.png`;
    const storagePath = `${ctx.tenantId}/${jobId}/${fileName}`;

    const supabase = await createApiClient(req);
    const { error: uploadError } = await supabase.storage
      .from("job-signatures")
      .upload(storagePath, buffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: { code: "UPLOAD_ERROR", message: "Failed to upload signature" } },
        { status: 500 }
      );
    }

    // Insert DB record
    const [signature] = await db
      .insert(jobSignatures)
      .values({
        tenantId: ctx.tenantId,
        jobId,
        signerName: input.signerName,
        signerRole: input.signerRole,
        storagePath,
        signedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ data: signature }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
