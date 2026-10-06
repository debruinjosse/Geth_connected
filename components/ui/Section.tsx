import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";
import { Container } from "@/components/ui/Container";

/** Page band with the system's vertical rhythm. Wraps children in a Container unless `bare`. */
export function Section({
  children,
  tone = "default",
  size = "lg",
  id,
  className,
  bare = false,
  ariaLabelledby
}: {
  children: ReactNode;
  tone?: "default" | "soft" | "tint";
  size?: "lg" | "sm";
  id?: string;
  className?: string;
  bare?: boolean;
  ariaLabelledby?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledby}
      className={cx("lp-section", size === "sm" && "lp-section-sm", tone === "soft" && "lp-bg-soft", tone === "tint" && "lp-bg-tint", className)}
    >
      {bare ? children : <Container>{children}</Container>}
    </section>
  );
}
