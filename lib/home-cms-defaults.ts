import {
  DEFAULT_MARQUEE_ITEMS_EN,
  DEFAULT_MARQUEE_ITEMS_NL
} from "@/lib/marquee-config";

export function getDefaultMarqueeItemsSerialized(locale: string) {
  const items = locale === "nl" ? DEFAULT_MARQUEE_ITEMS_NL : DEFAULT_MARQUEE_ITEMS_EN;
  return JSON.stringify(items);
}
