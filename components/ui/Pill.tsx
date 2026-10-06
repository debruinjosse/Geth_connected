import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

export function Pill({ tone = "neutral", children, className }: { tone?: "neutral" | "gold" | "green"; children: ReactNode; className?: string }) {
  return <span className={cx("lp-pill", tone === "gold" && "lp-pill-gold", tone === "green" && "lp-pill-green", className)}>{children}</span>;
}
