import { db } from "@/lib/db";
import { notifications } from "@fieldservice/shared/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { UserContext } from "@/lib/auth";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: Date;
}

export async function getRecentNotifications(
  ctx: UserContext,
  limit: number = 10
): Promise<NotificationItem[]> {
  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      title: notifications.title,
      message: notifications.message,
      entityType: notifications.entityType,
      entityId: notifications.entityId,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(
      and(
        eq(notifications.tenantId, ctx.tenantId),
        eq(notifications.userId, ctx.userId)
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return rows;
}

export async function getUnreadCount(ctx: UserContext): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.tenantId, ctx.tenantId),
        eq(notifications.userId, ctx.userId),
        eq(notifications.isRead, false)
      )
    );

  return result[0]?.count ?? 0;
}

export async function markNotificationRead(
  ctx: UserContext,
  notificationId: string
): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.tenantId, ctx.tenantId),
        eq(notifications.userId, ctx.userId)
      )
    );
}

export async function markAllNotificationsRead(
  ctx: UserContext
): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.tenantId, ctx.tenantId),
        eq(notifications.userId, ctx.userId),
        eq(notifications.isRead, false)
      )
    );
}
