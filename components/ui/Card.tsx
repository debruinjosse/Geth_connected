import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cx } from "@/components/ui/cx";

type CardProps<T extends ElementType> = {
  as?: T;
  tone?: "default" | "tint" | "dark" | "accent";
  size?: "sm" | "md" | "lg";
  flat?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "className" | "children">;

/** Surface used for forms, plans, callouts. `dark` is the purple brand card. */
export function Card<T extends ElementType = "div">({ as, tone = "default", size = "md", flat, className, children, ...rest }: CardProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      className={cx("lp-card", size === "sm" && "lp-card-sm", size === "lg" && "lp-card-lg", flat && "lp-card-flat", tone === "tint" && "lp-card-tint", tone === "dark" && "lp-card-dark", tone === "accent" && "lp-card-accent", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHead({ eyebrow, title, children }: { eyebrow?: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="lp-card-head">
      {eyebrow ? <span className="lp-eyebrow" style={{ display: "block", marginBottom: 12 }}>{eyebrow}</span> : null}
      <h2>{title}</h2>
      {children ? <p>{children}</p> : null}
    </div>
  );
}
