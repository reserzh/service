import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError, validateUUID } from "@/lib/api/errors";
import { getCallRecordings } from "@/lib/services/calls";
import { getRecordingMedia } from "@/lib/voice/twilio-voice";
import { db } from "@/lib/db";
import { callRecordings } from "@fieldservice/shared/db/schema";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string; recordingId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireApiAuth(req);
    const { id, recordingId } = await params;
    validateUUID(id);
    validateUUID(recordingId);

    // Verify the recording belongs to the call and tenant
    const [recording] = await db
      .select()
      .from(callRecordings)
      .where(
        and(
          eq(callRecordings.id, recordingId),
          eq(callRecordings.callId, id),
          eq(callRecordings.tenantId, ctx.tenantId)
        )
      )
      .limit(1);

    if (!recording) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Recording not found" } },
        { status: 404 }
      );
    }

    const response = await getRecordingMedia(recording.recordingSid);
    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `inline; filename="recording-${recording.recordingSid}.mp3"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
