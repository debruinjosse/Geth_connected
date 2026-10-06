import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

/** Responsive layout grid: `two`, `three`, `four` equal columns or `main` (wide + narrow). */
export function Grid({ cols = "two", children, className }: { cols?: "two" | "three" | "four" | "main"; children: ReactNode; className?: string }) {
  return <div className={cx("lp-grid", `lp-grid-${cols}`, className)}>{children}</div>;
}
