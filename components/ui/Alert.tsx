import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cx } from "@/components/ui/cx";

export type AlertTone = "info" | "success" | "error";

/** Inline status message (form feedback, notices). */
export function Alert({ tone = "info", title, children, className }: { tone?: AlertTone; title?: ReactNode; children?: ReactNode; className?: string }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "error" ? AlertCircle : Info;
  return (
    <div className={cx("lp-alert", `lp-alert-${tone}`, className)} role={tone === "error" ? "alert" : "status"} aria-live="polite">
      <Icon aria-hidden="true" />
      <div>
        {title ? <b>{title}</b> : null}
        {children}
      </div>
    </div>
  );
}
