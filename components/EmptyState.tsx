"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function EmptyState({
  eyebrow,
  title,
  copy,
  actionLabel,
  actionHref
}: {
  eyebrow?: string;
  title: string;
  copy: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  const t = useTranslations("common");
  const resolvedEyebrow = eyebrow ?? t("nothingYet");

  return (
    <div className="empty-state">
      <div className="eyebrow">{resolvedEyebrow}</div>
      <h3>{title}</h3>
      <p>{copy}</p>
      {actionLabel && actionHref ? (
        <Link className="btn btn-secondary" href={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
