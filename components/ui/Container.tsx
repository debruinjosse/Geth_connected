import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("lp-wrap", className)}>{children}</div>;
}
