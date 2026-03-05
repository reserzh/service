import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/voice/twilio-voice";
import { updateRecording } from "@/lib/services/calls";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = Object.fromEntries(new URLSearchParams(body));
  const signature = req.headers.get("x-twilio-signature") ?? "";

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/webhooks/twilio/voice/transcription`;
  if (!verifyWebhookSignature(webhookUrl, params, signature)) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  try {
    const recordingSid = params.RecordingSid;
    const transcriptionText = params.TranscriptionText;
    const transcriptionStatus = params.TranscriptionStatus; // completed, failed

    if (transcriptionStatus === "completed" && transcriptionText) {
      await updateRecording(recordingSid, {
        transcriptionText,
        transcriptionStatus: "completed",
      });
    } else {
      await updateRecording(recordingSid, {
        transcriptionStatus: "failed",
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Transcription Webhook] Error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
