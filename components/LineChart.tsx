const defaultPoints = [28, 48, 38, 66, 58, 92];
const defaultLabels = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];

/** Smooth-edged trend line with soft area fill, light grid and value labels (brand colours). */
export function LineChart({
  color = "var(--purple)",
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
  const chartLeft = 34;
  const chartRight = 482;
  const chartTop = 26;
  const chartBottom = 174;
  const chartHeight = chartBottom - chartTop;
  const xStep = (chartRight - chartLeft) / Math.max(safePoints.length - 1, 1);
  const coordinates = safePoints.map((point, index) => ({
    x: chartLeft + xStep * index,
    y: chartBottom - (point / max) * chartHeight,
    value: point,
    label: labels[index] ?? ""
  }));
  const line = coordinates.map(({ x, y }, index) => `${index === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${line} L${chartRight},${chartBottom} L${chartLeft},${chartBottom} Z`;
  const gradientId = `lp-lc-${Math.abs(safePoints.reduce((sum, value, index) => sum + value * (index + 3), 7))}`;
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({ y: chartTop + chartHeight * ratio, value: Math.round(max * (1 - ratio)) }));

  return (
    <div className={`lp-linechart${compact ? " lp-compact" : ""}`}>
      <svg viewBox="0 0 500 210" role="img" aria-label={ariaLabel}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#B69F57" stopOpacity=".26" />
            <stop offset="1" stopColor="#B69F57" stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridLines.map(({ y, value }) => (
          <g key={`${y}-${value}`}>
            <line x1={chartLeft} x2={chartRight} y1={y} y2={y} stroke="#E7E0D4" strokeWidth="1" strokeDasharray={value === 0 ? undefined : "3 5"} />
            <text x={0} y={y + 4} fontSize="11" fill="#7A6B7B">
              {value}
            </text>
          </g>
        ))}
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        {coordinates.map(({ x, y, value, label }) => (
          <g key={`${x}-${y}-${label}`}>
            <circle cx={x} cy={y} r="5" fill="#fff" stroke={color} strokeWidth="2.2">
              <title>{label ? `${label}: ${value}` : String(value)}</title>
            </circle>
            {showValues ? (
              <text x={x} y={Math.max(16, y - 13)} textAnchor="middle" fontSize="12" fontWeight="500" fill="#2B1A2C">
                {value}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
      <div className="lp-linechart-labels">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}
