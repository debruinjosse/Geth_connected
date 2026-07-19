import Link from "next/link";
import { Bell } from "lucide-react";
import { markNotificationReadAction } from "@/app/actions/notifications";
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

export function formatNotificationTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
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
  const localizedEmptyActionHref = getLocalizedHref(emptyActionHref, locale);

  if (!notifications.length) {
    return (
      <EmptyState
        eyebrow="No notifications"
        title={emptyTitle}
        copy={emptyCopy}
        actionHref={localizedEmptyActionHref}
        actionLabel={emptyActionLabel}
      />
    );
  }

  return (
    <div className="signal-list">
      {notifications.map((notification) => (
        <div className={`signal-card notification-card ${notification.read_at ? "" : "unread"}`.trim()} key={notification.id}>
          <div className="signal-icon" style={{ color: notification.read_at ? "var(--theme-muted)" : "var(--theme-gold)" }}>
            <Bell size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="notification-meta-row">
              <strong>{notification.title}</strong>
              <span className="quality-pill">{notification.type.replaceAll("_", " ")}</span>
            </div>
            <p>{notification.body}</p>
            {notification.href ? (
              <Link href={getLocalizedHref(notification.href, locale) ?? notification.href} style={{ color: "var(--theme-ink)", fontWeight: 800 }}>
                Open update
              </Link>
            ) : null}
          </div>
          <div style={{ display: "grid", gap: 10, justifyItems: "end" }}>
            <span className="quality-pill">{formatNotificationTime(notification.created_at)}</span>
            {!notification.read_at ? (
              <form action={markNotificationReadAction}>
                <input type="hidden" name="notification_id" value={notification.id} />
                <button className="btn btn-secondary" type="submit">
                  Mark read
                </button>
              </form>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
