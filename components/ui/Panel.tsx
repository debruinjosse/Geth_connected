import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cx } from "@/components/ui/cx";

/** Dashboard section: card with a quiet title row (title, description, optional action). */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  tone,
  id
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: "default" | "tint" | "dark" | "accent";
  id?: string;
}) {
  return (
    <Card as="section" id={id} tone={tone} className={cx("lp-panel", className)}>
      {title || action ? (
        <div className="lp-panel-head">
          <div>
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {action ? <div className="lp-panel-action">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </Card>
  );
}
