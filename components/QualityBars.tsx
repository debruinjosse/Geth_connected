import { topQualities } from "@/lib/demo-data";
import { categoryColors, normalizeCategoryKey } from "@/lib/cards";
import { normalizeQualityBarPercentages } from "@/lib/quality-percentages";

export type QualityBarItem = { label: string; value: number; category: string };

function resolveBarColor(category: string) {
  const categoryKey = normalizeCategoryKey(category);
  return categoryColors[categoryKey] ?? categoryColors[category] ?? "var(--theme-ink)";
}

function getBarWidth(value: number, valueMode: "count" | "percent", maxCount: number) {
  if (value <= 0) return 0;
  if (valueMode === "percent") return value;
  return Math.max(8, Math.round((value / maxCount) * 100));
}

export function QualityBars({
  items = topQualities,
  valueMode = "percent",
  valueSuffix
}: {
  items?: QualityBarItem[];
  valueSuffix?: string;
  valueMode?: "count" | "percent";
}) {
  const suffix = valueSuffix ?? (valueMode === "percent" ? "%" : "");
  const displayItems = valueMode === "percent" ? normalizeQualityBarPercentages(items) : items;
  const maxCount = Math.max(...displayItems.map((item) => item.value), 1);

  return (
    <div>
      {displayItems.map((quality) => {
        const barColor = resolveBarColor(quality.category);
        const barWidth = getBarWidth(quality.value, valueMode, maxCount);

        return (
          <div className="bar-row" key={quality.label}>
            <span>{quality.label}</span>
            <div className="bar-track">
              <span
                className="bar-fill"
                style={{
                  width: `${barWidth}%`,
                  minWidth: barWidth > 0 ? "8px" : undefined,
                  backgroundColor: barColor
                }}
              />
            </div>
            <b>
              {quality.value}
              {suffix}
            </b>
          </div>
        );
      })}
    </div>
  );
}
