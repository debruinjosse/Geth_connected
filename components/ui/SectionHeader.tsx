import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cx } from "@/components/ui/cx";

/** Eyebrow + h2 + optional supporting copy (the landing page section heading). */
export function SectionHeader({
  eyebrow,
  title,
  children,
  center = false,
  titleId,
  className
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  center?: boolean;
  titleId?: string;
  className?: string;
}) {
  return (
    <div className={cx("lp-sec-head", center && "lp-center", className)} style={center ? { textAlign: "center" } : undefined}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 id={titleId}>{title}</h2>
      {children ? <p>{children}</p> : null}
    </div>
  );
}
