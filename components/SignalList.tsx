"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

function localizeHref(href: string, locale: string) {
  if (!href.startsWith("/") || href.startsWith("/api") || href.startsWith("/auth")) {
    return href;
  }

  return `/${locale}${href}`;
}

export function SignalList({
  items
}: {
  items: Array<{
    id: string;
    tone: string;
    title: string;
    detail: string;
    actionLabel?: string;
    actionHref?: string;
    highlights?: Array<{ label: string; category: string; count: number; tone: string }>;
  }>;
}) {
  const locale = useLocale();
  const t = useTranslations("employeeHome");

  return (
    <div className="signal-list">
      {items.map((signal) => (
        <div className="signal-card" key={signal.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="signal-icon" style={{ color: signal.tone }}>
              AI
            </span>
            <div>
              <strong>{signal.title}</strong>
              <p>{signal.detail}</p>
              {signal.highlights?.length ? (
                <div className="signal-highlight-list" aria-label={t("signalHighlightsAria")}>
                  {signal.highlights.map((highlight) => (
                    <span
                      className="signal-highlight-pill"
                      key={`${signal.id}-${highlight.label}`}
                      style={{ "--signal-tone": highlight.tone } as CSSProperties}
                    >
                      <b>{highlight.label}</b>
                      <small>{highlight.category} - {t("signalHighlightCards", { count: highlight.count })}</small>
                    </span>
                  ))}
                </div>
              ) : null}
              {signal.actionHref && signal.actionLabel ? (
                <Link className="signal-action-link" href={localizeHref(signal.actionHref, locale)}>
                  {signal.actionLabel}
                </Link>
              ) : null}
            </div>
          </div>
          <strong>&rsaquo;</strong>
        </div>
      ))}
    </div>
  );
}
