import type { ReactNode } from "react";
import { StatCard } from "@/components/ui/StatCard";

/** Legacy API kept for existing callers; renders the shared StatCard. */
export function MetricCard({
  icon,
  value,
  label,
  helper
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
  helper?: string;
  /** ignored — colours come from the design system */
  tone?: string;
  /** ignored — colours come from the design system */
  iconBackground?: string;
}) {
  return <StatCard icon={icon} value={value} label={label} helper={helper} />;
}
