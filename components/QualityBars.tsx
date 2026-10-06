import { MeterList } from "@/components/ui/Meter";
import { normalizeCategoryKey } from "@/lib/cards";
import { topQualities } from "@/lib/demo-data";
import { normalizeQualityBarPercentages } from "@/lib/quality-percentages";

export type QualityBarItem = { label: string; value: number; category: string };

const CATEGORY_COLOR: Record<string, string> = {
  Communication: "var(--cat-com)",
  Creativity: "var(--cat-cre)",
  Competence: "var(--cat-cmp)",
  Collegiality: "var(--cat-col)"
};

function resolveBarColor(category: string) {
  return CATEGORY_COLOR[normalizeCategoryKey(category)] ?? "var(--purple)";
}

/** Top qualities as coloured meters (colour = card category). */
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

  return (
    <MeterList
      max={valueMode === "percent" ? 100 : undefined}
      items={displayItems.map((quality) => ({
        label: quality.label,
        value: quality.value,
        valueLabel: `${quality.value}${suffix}`,
        color: resolveBarColor(quality.category)
      }))}
    />
  );
}
