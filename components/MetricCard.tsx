import type { ReactNode } from "react";

export function MetricCard({
  icon,
  value,
  label,
  helper,
  tone = "var(--theme-ink)",
  iconBackground = "rgba(42, 23, 61, 0.06)"
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
  helper?: string;
  tone?: string;
  iconBackground?: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-icon" style={{ background: iconBackground, color: tone }}>
        {icon}
      </div>
      <div>
        <b style={{ color: tone }}>{value}</b>
        <span>{label}</span>
        {helper ? <small>{helper}</small> : null}
      </div>
    </div>
  );
}
