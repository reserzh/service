import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, generateTwimlResponse } from "@/lib/voice/twilio-voice";
import { createCallRecordFromWebhook, findTenantByVoiceNumber } from "@/lib/services/calls";
import { db } from "@/lib/db";
import { tenants } from "@fieldservice/shared/db/schema";
import { eq } from "drizzle-orm";
import type { TenantSettings } from "@fieldservice/shared/db/schema/tenants";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = Object.fromEntries(new URLSearchParams(body));
  const signature = req.headers.get("x-twilio-signature") ?? "";
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/webhooks/twilio/voice`;

  if (!verifyWebhookSignature(webhookUrl, params, signature)) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  try {
    const toNumber = params.To || "";
    const fromNumber = params.From || "";
    const callSid = params.CallSid || "";

    // Lookup tenant by the To number
    const tenantId = await findTenantByVoiceNumber(toNumber);
    if (!tenantId) {
      return new NextResponse(
        generateTwimlResponse({ greeting: "This number is not configured." }),
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // Get tenant settings
    const [tenant] = await db
      .select({ settings: tenants.settings })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const settings = (tenant?.settings ?? {}) as TenantSettings;
    const voice = settings.voice ?? {};

    // Create call record (auto-matches customer)
    await createCallRecordFromWebhook(tenantId, {
      callSid,
      direction: "inbound",
      fromNumber,
      toNumber,
      status: "ringing",
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const recordingCallback = `${baseUrl}/api/v1/webhooks/twilio/voice/recording`;

    const twiml = generateTwimlResponse({
      greeting: voice.greetingMessage,
      dialNumber: voice.forwardingNumber,
      voicemailEnabled: voice.voicemailEnabled ?? false,
      record: voice.autoRecord ?? false,
      recordingCallback,
    });

    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("[Voice Webhook] Error:", error);
    return new NextResponse(
      generateTwimlResponse({ greeting: "An error occurred. Please try again later." }),
      { headers: { "Content-Type": "text/xml" } }
    );
  }
}
