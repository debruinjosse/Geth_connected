export type MarqueeDividerStyle = "line" | "dot" | "none";

export type MarqueeConfig = {
  enabled: boolean;
  scrollSpeed: number;
  backgroundColor: string;
  textColor: string;
  dividerStyle: MarqueeDividerStyle;
  items: string[];
};

export const DEFAULT_MARQUEE_ITEMS_EN = [
  "Recognition That Lasts",
  "Privacy First",
  "Stronger Cultures",
  "AI-Powered Insights",
  "Human Recognition",
  "Measurable Culture"
];

export const DEFAULT_MARQUEE_ITEMS_NL = [
  "Waardering die blijft",
  "Privacy first",
  "Sterkere culturen",
  "AI-gestuurde inzichten",
  "Menselijke waardering",
  "Meetbare cultuur"
];

export const MARQUEE_SETTING_KEYS = [
  "marqueeEnabled",
  "marqueeScrollSpeed",
  "marqueeBackgroundColor",
  "marqueeTextColor",
  "marqueeDividerStyle"
] as const;

export const DEFAULT_MARQUEE_SETTINGS: Record<string, string> = {
  marqueeEnabled: "1",
  marqueeScrollSpeed: "42",
  marqueeBackgroundColor: "",
  marqueeTextColor: "",
  marqueeDividerStyle: "line"
};

export function getDefaultMarqueeItemsForLocale(locale: string) {
  return locale === "nl" ? DEFAULT_MARQUEE_ITEMS_NL : DEFAULT_MARQUEE_ITEMS_EN;
}

export function parseMarqueeItems(raw: string | undefined) {
  if (!raw?.trim()) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => String(item).trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export function parseMarqueeDividerStyle(value: string | undefined): MarqueeDividerStyle {
  if (value === "dot" || value === "none") return value;
  return "line";
}

function normalizeMarqueeColor(value: string, defaultHex: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === defaultHex.toLowerCase()) return "";
  return normalized;
}

export function buildMarqueeConfig(
  localeOverrides: Record<string, string>,
  settingsOverrides: Record<string, string>,
  locale: string
): MarqueeConfig {
  const itemsFromStore = parseMarqueeItems(localeOverrides.marqueeItems);
  const items = itemsFromStore.length ? itemsFromStore : getDefaultMarqueeItemsForLocale(locale);

  const enabledValue = settingsOverrides.marqueeEnabled ?? DEFAULT_MARQUEE_SETTINGS.marqueeEnabled;
  const scrollSpeed = Number(settingsOverrides.marqueeScrollSpeed ?? DEFAULT_MARQUEE_SETTINGS.marqueeScrollSpeed);
  const backgroundColor = normalizeMarqueeColor(
    settingsOverrides.marqueeBackgroundColor ?? "",
    "#fffdf8"
  );
  const textColor = normalizeMarqueeColor(settingsOverrides.marqueeTextColor ?? "", "#2a173d");
  const dividerStyle = parseMarqueeDividerStyle(
    settingsOverrides.marqueeDividerStyle ?? DEFAULT_MARQUEE_SETTINGS.marqueeDividerStyle
  );

  return {
    enabled: enabledValue !== "0" && enabledValue !== "false",
    scrollSpeed: Number.isFinite(scrollSpeed) && scrollSpeed > 0 ? scrollSpeed : 42,
    backgroundColor,
    textColor,
    dividerStyle,
    items
  };
}

export function serializeMarqueeSettings(settingsOverrides: Record<string, string>) {
  return Object.fromEntries(
    MARQUEE_SETTING_KEYS.map((key) => [key, settingsOverrides[key] ?? DEFAULT_MARQUEE_SETTINGS[key] ?? ""])
  );
}
