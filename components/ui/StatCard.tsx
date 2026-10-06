import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cx } from "@/components/ui/cx";

/** One headline number with a label and optional helper line. */
export function StatCard({
  label,
  value,
  helper,
  icon,
  className
}: {
  label: ReactNode;
  value: ReactNode;
  helper?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Card size="sm" className={cx("lp-stat", className)}>
      <div className="lp-stat-top">
        <span className="lp-stat-label">{label}</span>
        {icon ? <span className="lp-stat-icon" aria-hidden="true">{icon}</span> : null}
      </div>
      <b className="lp-stat-value">{value}</b>
      {helper ? <small className="lp-stat-helper">{helper}</small> : null}
    </Card>
  );
}
