import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/voice/twilio-voice";
import { updateCallBySid } from "@/lib/services/calls";
import type { CallStatus } from "@fieldservice/api-types/enums";

const TWILIO_STATUS_MAP: Record<string, CallStatus> = {
  initiated: "initiated",
  ringing: "ringing",
  "in-progress": "in_progress",
  completed: "completed",
  busy: "busy",
  "no-answer": "no_answer",
  failed: "failed",
  canceled: "canceled",
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = Object.fromEntries(new URLSearchParams(body));
  const signature = req.headers.get("x-twilio-signature") ?? "";

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/webhooks/twilio/voice/status`;
  if (!verifyWebhookSignature(webhookUrl, params, signature)) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  try {
    const callSid = params.CallSid;
    const callStatus = TWILIO_STATUS_MAP[params.CallStatus] ?? params.CallStatus;
    const duration = params.CallDuration ? parseInt(params.CallDuration, 10) : undefined;

    const updateData: Parameters<typeof updateCallBySid>[1] = {
      status: callStatus as CallStatus,
    };

    if (duration !== undefined) updateData.duration = duration;

    if (callStatus === "in_progress") {
      updateData.startedAt = new Date();
    }

    if (callStatus === "completed" || callStatus === "busy" || callStatus === "no_answer" || callStatus === "failed" || callStatus === "canceled") {
      updateData.endedAt = new Date();
    }

    await updateCallBySid(callSid, updateData);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Voice Status Webhook] Error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
