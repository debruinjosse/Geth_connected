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
    <div className="lp-feed">
      {items.map((signal) => (
        <div className="lp-feed-item" key={signal.id}>
          <span className="lp-signal-dot" style={{ background: signal.tone }} aria-hidden="true" />
          <div className="lp-feed-main">
            {signal.title ? <div className="lp-feed-title">{signal.title}</div> : null}
            <p className="lp-feed-note">{signal.detail}</p>
            {signal.highlights?.length ? (
              <div className="lp-chips" aria-label={t("signalHighlightsAria")}>
                {signal.highlights.map((highlight) => (
                  <span className="lp-chip-q" key={`${signal.id}-${highlight.label}`} style={{ "--c": highlight.tone } as CSSProperties}>
                    {highlight.label}
                    <small>
                      {highlight.category} · {t("signalHighlightCards", { count: highlight.count })}
                    </small>
                  </span>
                ))}
              </div>
            ) : null}
            {signal.actionHref && signal.actionLabel ? (
              <div className="lp-feed-actions">
                <Link className="lp-link" href={localizeHref(signal.actionHref, locale)}>
                  {signal.actionLabel}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
