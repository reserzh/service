const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

interface SendSmsParams {
  to: string;
  body: string;
}

interface TwilioResponse {
  sid: string;
}

export async function sendSms(params: SendSmsParams): Promise<TwilioResponse> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn("[SMS] Twilio credentials not configured, skipping SMS send");
    return { sid: `dry-run-${Date.now()}` };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

  const formBody = new URLSearchParams({
    To: params.to,
    From: TWILIO_PHONE_NUMBER,
    Body: params.body,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return { sid: data.sid };
}
