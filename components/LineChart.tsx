const defaultPoints = [28, 48, 38, 66, 58, 92];
const defaultLabels = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];

export function LineChart({
  color = "var(--theme-emerald)",
  points = defaultPoints,
  labels = defaultLabels,
  compact = false,
  ariaLabel = "Recognition trend chart",
  showValues = false
}: {
  color?: string;
  points?: number[];
  labels?: string[];
  compact?: boolean;
  ariaLabel?: string;
  showValues?: boolean;
}) {
  const safePoints = points.length ? points : [0, 0, 0, 0, 0, 0];
  const max = Math.max(Math.ceil(Math.max(...safePoints, 0)), 4);
  const min = 0;
  const chartLeft = 34;
  const chartRight = 482;
  const chartTop = 26;
  const chartBottom = 174;
  const chartHeight = chartBottom - chartTop;
  const xStep = (chartRight - chartLeft) / Math.max(safePoints.length - 1, 1);
  const coordinates = safePoints.map((point, index) => {
    const x = chartLeft + xStep * index;
    const normalized = (point - min) / (max - min || 1);
    const y = chartBottom - normalized * chartHeight;
    return { x, y, value: point, label: labels[index] ?? "" };
  });
  const chartPoints = coordinates.map(({ x, y }) => `${x},${y}`);
  const areaPoints = `${chartLeft},${chartBottom} ${chartPoints.join(" ")} ${chartRight},${chartBottom}`;
  const chartClassName = `line-chart ${compact ? "compact" : ""}`.trim();
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const value = Math.round(max * (1 - ratio));
    const y = chartTop + chartHeight * ratio;
    return { y, value };
  });

  return (
    <div className={chartClassName}>
      <svg viewBox="0 0 500 210" role="img" aria-label={ariaLabel}>
        {gridLines.map(({ y, value }) => (
          <g key={`${y}-${value}`}>
            <line className="line-chart-grid" x1={chartLeft} x2={chartRight} y1={y} y2={y} />
            <text className="line-chart-axis-label" x={0} y={y + 4}>
              {value}
            </text>
          </g>
        ))}
        {coordinates.map(({ x, label }) => (
          <line className="line-chart-tick" key={`tick-${x}-${label}`} x1={x} x2={x} y1={chartTop} y2={chartBottom} />
        ))}
        <path className="line-chart-area" d={`M${areaPoints}Z`} fill={color} />
        <polyline className="line-chart-line-shadow" points={chartPoints.join(" ")} fill="none" stroke={color} strokeLinecap="round" />
        <polyline className="line-chart-line" points={chartPoints.join(" ")} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
        {coordinates.map(({ x, y, value, label }) => {
          const title = label ? `${label}: ${value}` : String(value);
          return (
            <g key={`${x}-${y}-${label}`}>
              <circle className="line-chart-point-halo" cx={x} cy={y} r="11" fill={color} />
              <circle className="line-chart-point" cx={x} cy={y} r="6" fill="white" stroke={color}>
                <title>{title}</title>
              </circle>
              {showValues ? (
                <text x={x} y={Math.max(18, y - 14)} textAnchor="middle" className="line-chart-value">
                  {value}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <div className="line-chart-labels">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}
