import { topQualities } from "@/lib/demo-data";
import { categoryColors } from "@/lib/cards";
import { normalizeQualityBarPercentages } from "@/lib/quality-percentages";

export type QualityBarItem = { label: string; value: number; category: string };

export function QualityBars({
  items = topQualities,
  valueSuffix = "%"
}: {
  items?: QualityBarItem[];
  valueSuffix?: string;
}) {
  const normalizedItems = normalizeQualityBarPercentages(items);

  return (
    <div>
      {normalizedItems.map((quality) => (
        <div className="bar-row" key={quality.label}>
          <span>{quality.label}</span>
          <div className="bar-track">
            <span style={{ width: `${quality.value}%`, background: categoryColors[quality.category] ?? "var(--theme-ink)" }} />
          </div>
          <b>
            {quality.value}
            {valueSuffix}
          </b>
        </div>
      ))}
    </div>
  );
}
