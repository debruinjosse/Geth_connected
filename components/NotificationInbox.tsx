"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CheckCircle2, Bell } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/EmptyState";

export type NotificationInboxRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export function formatNotificationTime(
  value: string,
  t?: (key: string, values?: Record<string, string | number | Date>) => string,
  locale = "nl"
) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  const label = (key: string, count: number) => (t ? t(key, { count }) : `${count}${key.charAt(0)}`);

  if (diffMinutes < 60) return label("minutesAgo", diffMinutes);
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return label("hoursAgo", diffHours);
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return label("daysAgo", diffDays);

  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(value));
}

function getLocalizedHref(href: string | undefined, locale: string) {
  if (!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#")) {
    return href;
  }

  if (!href.startsWith("/")) {
    return href;
  }

  if (href.startsWith(`/${locale}/`) || href === `/${locale}` || href.startsWith("/auth/")) {
    return href;
  }

  return `/${locale}${href}`;
}

export function NotificationInbox({
  notifications,
  emptyTitle,
  emptyCopy,
  emptyActionHref,
  emptyActionLabel,
  locale = "en"
}: {
  notifications: NotificationInboxRow[];
  emptyTitle: string;
  emptyCopy: string;
  emptyActionHref?: string;
  emptyActionLabel?: string;
  locale?: string;
}) {
  const router = useRouter();
  const t = useTranslations("notifications");
  const localizedEmptyActionHref = getLocalizedHref(emptyActionHref, locale);
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function markRead(notificationId: string) {
    const readAt = new Date().toISOString();
    setPendingId(notificationId);
    setLocalNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId ? { ...notification, read_at: readAt } : notification
      )
    );

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: readAt })
        .eq("id", notificationId);

      if (error) {
        console.error("Failed to mark notification read", error);
        setLocalNotifications((current) =>
          current.map((notification) =>
            notification.id === notificationId ? { ...notification, read_at: null } : notification
          )
        );
      } else {
        router.refresh();
      }
    } finally {
      setPendingId(null);
    }
  }

  if (!localNotifications.length) {
    return (
      <EmptyState
        eyebrow={t("emptyEyebrow")}
        title={emptyTitle}
        copy={emptyCopy}
        actionHref={localizedEmptyActionHref}
        actionLabel={emptyActionLabel}
      />
    );
  }

  return (
    <div className="signal-list">
      {localNotifications.map((notification) => (
        <div className={`signal-card notification-card ${notification.read_at ? "" : "unread"}`.trim()} key={notification.id}>
          <div className="signal-icon notification-card-icon" style={{ color: notification.read_at ? "var(--theme-muted)" : "var(--theme-gold)" }}>
            <Bell size={18} />
          </div>
          <div className="notification-card-content">
            <div className="notification-meta-row">
              <strong>{notification.title}</strong>
              <span className="quality-pill">{notification.type.replaceAll("_", " ")}</span>
            </div>
            <p className="notification-card-body">{notification.body}</p>
            {notification.href ? (
              <Link href={getLocalizedHref(notification.href, locale) ?? notification.href} className="notification-card-link">
                {t("openUpdate")}
              </Link>
            ) : null}
          </div>
          <div className="notification-card-side">
            <span className="quality-pill">{formatNotificationTime(notification.created_at, t, locale)}</span>
            {!notification.read_at ? (
              <button className="btn btn-secondary" type="button" disabled={pendingId === notification.id} onClick={() => markRead(notification.id)}>
                {pendingId === notification.id ? t("marking") : t("markRead")}
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MarkAllNotificationsReadButton({ label }: { label?: string }) {
  const router = useRouter();
  const t = useTranslations("notifications");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function markAllRead() {
    setPending(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null);

      if (error) {
        console.error("Failed to mark all notifications read", error);
        return;
      }

      setDone(true);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return null;
  }

  return (
    <button className="btn btn-secondary" type="button" onClick={markAllRead} disabled={pending}>
      <CheckCircle2 size={16} /> {pending ? t("marking") : label ?? t("markAllRead")}
    </button>
  );
}
