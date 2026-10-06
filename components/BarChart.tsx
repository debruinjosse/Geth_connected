import { MeterList } from "@/components/ui/Meter";

type BarChartItem = {
  key?: string;
  label: string;
  value: number;
  color?: string;
  helper?: string;
  valueLabel?: string;
};

/** Horizontal comparison bars (legacy API) rendered with the shared meter list. */
export function BarChart({
  items,
  valueSuffix = ""
}: {
  items: BarChartItem[];
  valueSuffix?: string;
  /** kept for API compatibility */
  compact?: boolean;
}) {
  return (
    <MeterList
      items={items.map((item) => ({
        label: item.label,
        value: item.value,
        valueLabel: item.valueLabel ?? `${item.value}${valueSuffix}`,
        helper: item.helper,
        color: item.color
      }))}
    />
  );
}
