export type BarsSeries = { name: string; color: string; values: number[] };

/** Small grouped column chart (e.g. cards received vs given per month). */
export function BarsChart({ labels, series, height = 176 }: { labels: string[]; series: BarsSeries[]; height?: number }) {
  const max = Math.max(...series.flatMap((item) => item.values), 1);

  return (
    <div>
      <div className="lp-bars-legend">
        {series.map((item) => (
          <span key={item.name}>
            <i style={{ background: item.color }} />
            {item.name}
          </span>
        ))}
      </div>
      <div className="lp-bars" style={{ height: height + 52 }} role="img" aria-label={series.map((item) => `${item.name}: ${item.values.join(", ")}`).join(" · ")}>
        {labels.map((label, index) => (
          <div className="lp-bars-col" key={label + index}>
            <div className="lp-bars-stack" style={{ height }}>
              {series.map((item) => {
                const value = item.values[index] ?? 0;
                return (
                  <div className="lp-bar-wrap" key={item.name}>
                    <span className="lp-bar-value">{value || ""}</span>
                    <span className="lp-bar" style={{ height: `${value > 0 ? Math.max(6, (value / max) * 100) : 2}%`, background: item.color, opacity: value > 0 ? 1 : 0.25 }} />
                  </div>
                );
              })}
            </div>
            <span className="lp-bars-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
