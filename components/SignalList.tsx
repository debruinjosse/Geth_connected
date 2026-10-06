"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";

function localizeHref(href: string, locale: string) {
  if (!href.startsWith("/") || href.startsWith("/api") || href.startsWith("/auth")) {
    return href;
  }

  return `/${locale}${href}`;
}

export function SignalList({
  items,
  variant = "default"
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
  variant?: "default" | "coaching";
}) {
  const locale = useLocale();
  const t = useTranslations("employeeHome");
  const coaching = variant === "coaching";

  if (!coaching) {
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

  return (
    <div className={`signal-list${coaching ? " signal-list-coaching" : ""}`}>
      {items.map((signal) => (
        <div className={`signal-card${coaching ? " signal-card-coaching" : ""}`} key={signal.id}>
          <div style={{ display: "flex", alignItems: coaching ? "flex-start" : "center", gap: 12 }}>
            <span className="signal-icon" style={{ color: signal.tone }} aria-hidden="true">
              <Sparkles size={16} />
            </span>
            <div>
              {!coaching && signal.title ? <strong>{signal.title}</strong> : null}
              <p>{signal.detail}</p>
              {!coaching && signal.highlights?.length ? (
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
          {!coaching ? <strong>&rsaquo;</strong> : null}
        </div>
      ))}
    </div>
  );
}
