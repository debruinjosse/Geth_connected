const defaultPoints = [28, 48, 38, 66, 58, 92];
const defaultLabels = ["Jul", "Aug", "Sep"];

export function LineChart({
  color = "var(--theme-emerald)",
  points = defaultPoints,
  labels = defaultLabels,
  compact = false
}: {
  color?: string;
  points?: number[];
  labels?: string[];
  compact?: boolean;
}) {
  const max = Math.max(...points, 100);
  const min = 0;
  const xStep = 480 / Math.max(points.length - 1, 1);
  const chartPoints = points
    .map((point, index) => {
      const x = 10 + xStep * index;
      const normalized = (point - min) / (max - min || 1);
      const y = 180 - normalized * 140;
      return { x, y };
    })
    .map(({ x, y }) => `${x},${y}`);

  return (
    <div className={`line-chart ${compact ? "compact" : ""}`.trim()} aria-label="Recognition trend chart">
      <svg viewBox="0 0 500 210" preserveAspectRatio="none">
        <polyline points={chartPoints.join(" ")} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
        {chartPoints.map((point) => {
          const [x, y] = point.split(",").map(Number);
          return <circle key={`${x}-${y}`} cx={x} cy={y} r="6" fill="white" stroke={color} strokeWidth="4" />;
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", color: "var(--theme-muted)", fontSize: 13 }}>
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}
