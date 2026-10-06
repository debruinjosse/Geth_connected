import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("lp-eyebrow", className)}>{children}</span>;
}
