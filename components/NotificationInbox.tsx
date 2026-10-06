"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { approveRecognitionVerification, rejectRecognitionVerification } from "@/app/actions/recognitionVerification";

const VERIFICATION_HREF_PATTERN = /^\/recognitions\/([^/]+)\/verify$/;

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
  const [verificationPendingId, setVerificationPendingId] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<{ notificationId: string; message: string } | null>(null);

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

  async function resolveVerification(notificationId: string, recognitionId: string, action: "approve" | "reject") {
    setVerificationError(null);
    setVerificationPendingId(notificationId);

    try {
      const result = action === "approve" ? await approveRecognitionVerification(recognitionId) : await rejectRecognitionVerification(recognitionId);
      if (!result.ok) {
        setVerificationError({ notificationId, message: result.message });
        return;
      }
      setVerificationError(null);
      await markRead(notificationId);
    } finally {
      setVerificationPendingId(null);
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
    <div className="lp-feed">
      {localNotifications.map((notification) => {
        const verificationMatch =
          notification.type === "recognition_verification_requested" ? notification.href?.match(VERIFICATION_HREF_PATTERN) : null;
        const recognitionId = verificationMatch?.[1];
        const isVerificationBusy = verificationPendingId === notification.id;
        const unread = !notification.read_at;

        return (
          <div className="lp-feed-item" key={notification.id}>
            <span className={`lp-notif-dot${unread ? "" : " lp-read"}`} aria-hidden="true" />
            <div className="lp-feed-main">
              <div className="lp-feed-title" style={{ fontWeight: unread ? 500 : 400 }}>
                {notification.title}
                <span className="lp-feed-tag">{notification.type.replaceAll("_", " ")}</span>
              </div>
              <p className="lp-feed-note">{notification.body}</p>
              {recognitionId && !notification.read_at ? (
                <>
                  {verificationError?.notificationId === notification.id ? (
                    <div style={{ marginTop: 12 }}>
                      <Alert tone="error">{verificationError.message}</Alert>
                    </div>
                  ) : null}
                  <div className="lp-feed-actions">
                    <Button size="sm" disabled={isVerificationBusy} onClick={() => resolveVerification(notification.id, recognitionId, "approve")}>
                      {isVerificationBusy ? t("marking") : t("approve")}
                    </Button>
                    <Button size="sm" variant="ghost" disabled={isVerificationBusy} onClick={() => resolveVerification(notification.id, recognitionId, "reject")}>
                      {isVerificationBusy ? t("marking") : t("reject")}
                    </Button>
                  </div>
                </>
              ) : recognitionId ? (
                <div className="lp-feed-actions">
                  <span className="lp-pill lp-pill-green">{t("resolved")}</span>
                </div>
              ) : notification.href ? (
                <div className="lp-feed-actions">
                  <Link href={getLocalizedHref(notification.href, locale) ?? notification.href} className="lp-link">
                    {t("openUpdate")}
                  </Link>
                </div>
              ) : null}
            </div>
            <div className="lp-feed-meta">
              {formatNotificationTime(notification.created_at, t, locale)}
              {unread && !recognitionId ? (
                <div style={{ marginTop: 8 }}>
                  <Button size="sm" variant="ghost" disabled={pendingId === notification.id} onClick={() => markRead(notification.id)}>
                    {pendingId === notification.id ? t("marking") : t("markRead")}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
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
    <Button variant="ghost" size="sm" onClick={markAllRead} disabled={pending} icon={<CheckCircle2 />}>
      {pending ? t("marking") : label ?? t("markAllRead")}
    </Button>
  );
}
