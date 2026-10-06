"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

/** Quiet placeholder for lists with nothing in them yet. */
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
    <div className="lp lp-empty">
      <Eyebrow>{resolvedEyebrow}</Eyebrow>
      <h3>{title}</h3>
      <p>{copy}</p>
      {actionLabel && actionHref ? (
        <Button href={actionHref} variant="ghost" size="sm">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
