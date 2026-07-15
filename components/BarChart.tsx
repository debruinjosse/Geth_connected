type BarChartItem = {
  label: string;
  value: number;
  color?: string;
  helper?: string;
  valueLabel?: string;
};

export function BarChart({
  items,
  valueSuffix = "",
  compact = false
}: {
  items: BarChartItem[];
  valueSuffix?: string;
  compact?: boolean;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className={compact ? "bar-chart compact" : "bar-chart"} aria-label="Bar chart">
      {items.map((item) => {
        const width = item.value > 0 ? Math.max(8, Math.round((item.value / max) * 100)) : 0;

        return (
          <div className="bar-chart-row" key={item.label}>
            <div className="bar-chart-meta">
              <span>{item.label}</span>
              <strong>
                {item.valueLabel ?? `${item.value}${valueSuffix}`}
              </strong>
            </div>
            {item.helper ? <p>{item.helper}</p> : null}
            <div className="bar-chart-track">
              <span style={{ width: `${width}%`, background: item.color ?? "var(--theme-ink)" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
