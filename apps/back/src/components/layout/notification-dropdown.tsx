"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  markNotificationReadAction,
  markAllReadAction,
} from "@/actions/notifications";
import type { NotificationItem } from "@/lib/services/notifications";
import { formatDistanceToNow } from "date-fns";

function getNotificationHref(notification: NotificationItem): string | null {
  if (!notification.entityType || !notification.entityId) return null;
  const map: Record<string, string> = {
    job: "/jobs",
    customer: "/customers",
    estimate: "/estimates",
    invoice: "/invoices",
    booking: "/website/bookings",
  };
  const base = map[notification.entityType];
  return base ? `${base}/${notification.entityId}` : null;
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [hasLoaded, setHasLoaded] = useState(false);
  const lastFetchRef = useRef<number>(0);
  const mountedRef = useRef(true);
  const router = useRouter();

  // Use fetch() to the API route instead of a server action.
  // Server actions (even without startTransition) trigger RSC re-renders
  // of the current route, which causes an infinite render loop.
  const loadNotifications = useCallback(async () => {
    if (Date.now() - lastFetchRef.current < 5000) return;
    lastFetchRef.current = Date.now();

    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/notifications?limit=10");
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();
      if (mountedRef.current) {
        setNotifications(json.data ?? []);
        setUnreadCount(json.meta?.unreadCount ?? 0);
      }
    } catch {
      // Silently fail - notifications are non-critical
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setHasLoaded(true);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (open) loadNotifications();
  }, [open, loadNotifications]);

  function handleMarkRead(notificationId: string) {
    startTransition(async () => {
      try {
        await markNotificationReadAction(notificationId);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Silently fail
      }
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      try {
        await markAllReadAction();
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      } catch {
        // Silently fail
      }
    });
  }

  function handleClickNotification(notification: NotificationItem) {
    if (!notification.isRead) {
      handleMarkRead(notification.id);
    }
    const href = getNotificationHref(notification);
    if (href) {
      setOpen(false);
      router.push(href);
    }
  }

  const loading = isLoading || isPending;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label={
            unreadCount > 0
              ? `Notifications - ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground"
              aria-hidden="true"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={handleMarkAllRead}
              disabled={loading}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <Separator />

        <ScrollArea className="max-h-80">
          {!hasLoaded && loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                    !notification.isRead ? "bg-muted/30" : ""
                  }`}
                  onClick={() => handleClickNotification(notification)}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight ${!notification.isRead ? "font-medium" : ""}`}>
                      {notification.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="flex items-start pt-1">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
