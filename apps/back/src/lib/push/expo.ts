import { db } from "@/lib/db";
import { pushTokens } from "@fieldservice/shared/db/schema";
import { eq, and, inArray } from "drizzle-orm";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default" | null;
  priority?: "default" | "normal" | "high";
}

interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface SendPushParams {
  tenantId: string;
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send push notifications to one or more users via the Expo Push API.
 * Looks up push tokens from the database, sends the notification,
 * and cleans up any tokens that are no longer registered.
 */
export async function sendPushNotifications(params: SendPushParams): Promise<void> {
  const { tenantId, userIds, title, body, data } = params;

  if (userIds.length === 0) return;

  // Fetch all push tokens for the given users within the tenant
  const tokens = await db
    .select({
      id: pushTokens.id,
      token: pushTokens.token,
      userId: pushTokens.userId,
    })
    .from(pushTokens)
    .where(
      and(
        eq(pushTokens.tenantId, tenantId),
        inArray(pushTokens.userId, userIds)
      )
    );

  if (tokens.length === 0) return;

  // Build Expo push messages
  const messages: ExpoPushMessage[] = tokens.map((t) => ({
    to: t.token,
    title,
    body,
    sound: "default",
    priority: "high",
    ...(data ? { data } : {}),
  }));

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      console.error(
        "[Push] Expo API returned non-OK status:",
        response.status,
        await response.text()
      );
      return;
    }

    const result = await response.json() as { data: ExpoPushTicket[] };
    const tickets = result.data;

    // Clean up tokens that are no longer registered
    const tokensToDelete: string[] = [];
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (
        ticket.status === "error" &&
        ticket.details?.error === "DeviceNotRegistered"
      ) {
        tokensToDelete.push(tokens[i].id);
      }
    }

    if (tokensToDelete.length > 0) {
      await db
        .delete(pushTokens)
        .where(inArray(pushTokens.id, tokensToDelete));
      console.log(
        `[Push] Removed ${tokensToDelete.length} expired push token(s)`
      );
    }
  } catch (error) {
    console.error("[Push] Failed to send push notifications:", error);
  }
}
