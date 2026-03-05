import crypto from "crypto";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_TWIML_APP_SID = process.env.TWILIO_TWIML_APP_SID;
const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
const TWILIO_API_SECRET = process.env.TWILIO_API_SECRET;

function getAuthHeader() {
  return "Basic " + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
}

function twilioUrl(path: string) {
  return `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}${path}`;
}

export function isVoiceConfigured(): boolean {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN);
}

export interface InitiateCallParams {
  to: string;
  from: string;
  statusCallback: string;
  record?: boolean;
  recordingStatusCallback?: string;
}

export async function initiateOutboundCall(params: InitiateCallParams): Promise<{ sid: string }> {
  if (!isVoiceConfigured()) {
    console.warn("[Voice] Twilio credentials not configured, skipping call");
    return { sid: `dry-run-${Date.now()}` };
  }

  const formBody = new URLSearchParams({
    To: params.to,
    From: params.from,
    Url: `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/webhooks/twilio/voice`,
    StatusCallback: params.statusCallback,
    StatusCallbackEvent: "initiated ringing answered completed",
    StatusCallbackMethod: "POST",
  });

  if (params.record) {
    formBody.set("Record", "true");
    if (params.recordingStatusCallback) {
      formBody.set("RecordingStatusCallback", params.recordingStatusCallback);
      formBody.set("RecordingStatusCallbackMethod", "POST");
    }
  }

  const response = await fetch(twilioUrl("/Calls.json"), {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio Voice API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return { sid: data.sid };
}

export async function getCallDetails(callSid: string) {
  const response = await fetch(twilioUrl(`/Calls/${callSid}.json`), {
    headers: { Authorization: getAuthHeader() },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio API error (${response.status}): ${error}`);
  }

  return response.json();
}

export async function getRecording(recordingSid: string) {
  const response = await fetch(twilioUrl(`/Recordings/${recordingSid}.json`), {
    headers: { Authorization: getAuthHeader() },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio API error (${response.status}): ${error}`);
  }

  return response.json();
}

export async function getRecordingMedia(recordingSid: string): Promise<Response> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Recordings/${recordingSid}.mp3`;

  const response = await fetch(url, {
    headers: { Authorization: getAuthHeader() },
  });

  if (!response.ok) {
    throw new Error(`Twilio media error (${response.status})`);
  }

  return response;
}

export function generateTwimlResponse(options: {
  greeting?: string;
  dialNumber?: string;
  voicemailEnabled?: boolean;
  record?: boolean;
  recordingCallback?: string;
}): string {
  let twiml = '<?xml version="1.0" encoding="UTF-8"?><Response>';

  if (options.greeting) {
    twiml += `<Say voice="alice">${escapeXml(options.greeting)}</Say>`;
  }

  if (options.dialNumber) {
    twiml += "<Dial";
    if (options.record) {
      twiml += ' record="record-from-answer-dual"';
      if (options.recordingCallback) {
        twiml += ` recordingStatusCallback="${escapeXml(options.recordingCallback)}"`;
        twiml += ' recordingStatusCallbackMethod="POST"';
      }
    }
    twiml += `><Number>${escapeXml(options.dialNumber)}</Number></Dial>`;
  }

  if (options.voicemailEnabled) {
    twiml += '<Say voice="alice">Please leave a message after the beep.</Say>';
    twiml += "<Record maxLength=\"120\" transcribe=\"false\"";
    if (options.recordingCallback) {
      twiml += ` recordingStatusCallback="${escapeXml(options.recordingCallback)}"`;
      twiml += ' recordingStatusCallbackMethod="POST"';
    }
    twiml += " />";
  }

  twiml += "</Response>";
  return twiml;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function verifyWebhookSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  if (!TWILIO_AUTH_TOKEN) return false;

  const sortedKeys = Object.keys(params).sort();
  let dataString = url;
  for (const key of sortedKeys) {
    dataString += key + params[key];
  }

  const computed = crypto
    .createHmac("sha1", TWILIO_AUTH_TOKEN)
    .update(dataString)
    .digest("base64");

  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
}

export function getTwimlAppSid(): string | undefined {
  return TWILIO_TWIML_APP_SID;
}

export function getApiKeyCredentials() {
  return {
    apiKey: TWILIO_API_KEY,
    apiSecret: TWILIO_API_SECRET,
    accountSid: TWILIO_ACCOUNT_SID,
  };
}
