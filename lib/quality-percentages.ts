import type { QualityBarItem } from "@/components/QualityBars";

/**
 * Convert raw counts into whole-number percentages that sum to 100.
 */
export function getPercentageMix(values: number[]): number[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!total) return values.map(() => 0);

  const rounded = values.map((value) => Math.round((value / total) * 100));
  const drift = 100 - rounded.reduce((sum, value) => sum + value, 0);
  if (rounded.length) rounded[0] += drift;
  return rounded;
}

export function normalizeQualityBarPercentages(items: QualityBarItem[]): QualityBarItem[] {
  const percentages = getPercentageMix(items.map((item) => item.value));
  return items.map((item, index) => ({ ...item, value: percentages[index] ?? 0 }));
}

export function qualityBarsFromCounts(
  entries: Array<{ label: string; category: string; count: number }>,
  limit = 5
): QualityBarItem[] {
  const topEntries = entries.sort((a, b) => b.count - a.count).slice(0, limit);
  const percentages = getPercentageMix(topEntries.map((entry) => entry.count));

  return topEntries.map((entry, index) => ({
    label: entry.label,
    category: entry.category,
    value: percentages[index] ?? 0
  }));
}
