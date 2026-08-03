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
  const tm = useTranslations("manager");
  const coaching = variant === "coaching";

  return (
    <div className={`signal-list${coaching ? " signal-list-coaching" : ""}`}>
      {items.map((signal) => (
        <div className={`signal-card${coaching ? " signal-card-coaching" : ""}`} key={signal.id}>
          <div style={{ display: "flex", alignItems: coaching ? "flex-start" : "center", gap: 12 }}>
            <span className="signal-icon" style={{ color: signal.tone }} aria-hidden="true">
              {coaching ? <Sparkles size={16} /> : <span className="signal-icon-label">{tm("signalBadge")}</span>}
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
