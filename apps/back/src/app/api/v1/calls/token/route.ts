import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { getApiKeyCredentials, getTwimlAppSid } from "@/lib/voice/twilio-voice";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);

    const { apiKey, apiSecret, accountSid } = getApiKeyCredentials();
    const twimlAppSid = getTwimlAppSid();

    if (!apiKey || !apiSecret || !accountSid || !twimlAppSid) {
      return NextResponse.json(
        { error: { code: "NOT_CONFIGURED", message: "Twilio Voice client not configured" } },
        { status: 503 }
      );
    }

    // Dynamic import twilio for AccessToken generation (Phase 4 dependency)
    try {
      // @ts-ignore -- twilio types are only available when the package is installed
      const twilio = await import("twilio");
      const AccessToken = twilio.jwt.AccessToken;
      const VoiceGrant = AccessToken.VoiceGrant;

      const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: twimlAppSid,
        incomingAllow: true,
      });

      const token = new AccessToken(accountSid, apiKey, apiSecret, {
        identity: ctx.userId,
      });
      token.addGrant(voiceGrant);

      return NextResponse.json({
        data: {
          token: token.toJwt(),
          identity: ctx.userId,
        },
      });
    } catch {
      return NextResponse.json(
        { error: { code: "NOT_CONFIGURED", message: "twilio package not installed. Install it for browser calling." } },
        { status: 503 }
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
}
