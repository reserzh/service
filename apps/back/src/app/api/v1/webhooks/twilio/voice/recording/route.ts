import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/voice/twilio-voice";
import { createRecording, updateRecording } from "@/lib/services/calls";
import { db } from "@/lib/db";
import { calls, tenants } from "@fieldservice/shared/db/schema";
import { eq } from "drizzle-orm";
import type { TenantSettings } from "@fieldservice/shared/db/schema/tenants";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = Object.fromEntries(new URLSearchParams(body));
  const signature = req.headers.get("x-twilio-signature") ?? "";

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/webhooks/twilio/voice/recording`;
  if (!verifyWebhookSignature(webhookUrl, params, signature)) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  try {
    const recordingSid = params.RecordingSid;
    const callSid = params.CallSid;
    const recordingUrl = params.RecordingUrl;
    const duration = params.RecordingDuration ? parseInt(params.RecordingDuration, 10) : undefined;
    const recordingStatus = params.RecordingStatus; // completed, failed, absent

    // Find the call record
    const [call] = await db
      .select({ id: calls.id, tenantId: calls.tenantId })
      .from(calls)
      .where(eq(calls.callSid, callSid))
      .limit(1);

    if (!call) {
      console.warn(`[Recording Webhook] No call found for SID: ${callSid}`);
      return NextResponse.json({ received: true });
    }

    if (recordingStatus === "completed") {
      await createRecording(call.tenantId, {
        callId: call.id,
        recordingSid,
        duration,
        recordingUrl,
        status: "completed",
      });

      // Check if transcription is enabled
      const [tenant] = await db
        .select({ settings: tenants.settings })
        .from(tenants)
        .where(eq(tenants.id, call.tenantId))
        .limit(1);

      const settings = (tenant?.settings ?? {}) as TenantSettings;
      if (settings.voice?.transcriptionEnabled) {
        await updateRecording(recordingSid, { transcriptionStatus: "processing" });
      }
    } else {
      await createRecording(call.tenantId, {
        callId: call.id,
        recordingSid,
        status: "failed",
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Recording Webhook] Error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
