"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import {
  getRecentNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from "@/lib/services/notifications";

const uuidSchema = z.string().uuid();

export async function getNotificationsAction(): Promise<{
  notifications: NotificationItem[];
  unreadCount: number;
}> {
  try {
    const ctx = await requireAuth();
    const [notifs, unreadCount] = await Promise.all([
      getRecentNotifications(ctx, 10),
      getUnreadCount(ctx),
    ]);
    return { notifications: notifs, unreadCount };
  } catch {
    return { notifications: [], unreadCount: 0 };
  }
}

export async function markNotificationReadAction(
  notificationId: string
): Promise<void> {
  const parsed = uuidSchema.safeParse(notificationId);
  if (!parsed.success) return;

  const ctx = await requireAuth();
  await markNotificationRead(ctx, parsed.data);
}

export async function markAllReadAction(): Promise<void> {
  const ctx = await requireAuth();
  await markAllNotificationsRead(ctx);
}
