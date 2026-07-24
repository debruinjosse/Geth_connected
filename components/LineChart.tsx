const defaultPoints = [28, 48, 38, 66, 58, 92];
const defaultLabels = ["Jul", "Aug", "Sep"];

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
  const max = Math.max(...safePoints, 1);
  const min = 0;
  const xStep = 480 / Math.max(safePoints.length - 1, 1);
  const coordinates = safePoints.map((point, index) => {
    const x = 10 + xStep * index;
    const normalized = (point - min) / (max - min || 1);
    const y = 180 - normalized * 140;
    return { x, y, value: point, label: labels[index] ?? "" };
  });
  const chartPoints = coordinates.map(({ x, y }) => `${x},${y}`);
  const areaPoints = `10,180 ${chartPoints.join(" ")} 490,180`;
  const chartClassName = `line-chart ${compact ? "compact" : ""}`.trim();

  return (
    <div className={chartClassName}>
      <svg viewBox="0 0 500 210" preserveAspectRatio="none" role="img" aria-label={ariaLabel}>
        <path className="line-chart-area" d={`M${areaPoints}Z`} fill={color} />
        <polyline points={chartPoints.join(" ")} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
        {coordinates.map(({ x, y, value, label }) => {
          const title = label ? `${label}: ${value}` : String(value);
          return (
            <g key={`${x}-${y}-${label}`}>
              <circle cx={x} cy={y} r="6" fill="white" stroke={color} strokeWidth="4">
                <title>{title}</title>
              </circle>
              {showValues ? (
                <text x={x} y={Math.max(16, y - 12)} textAnchor="middle" className="line-chart-value">
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
