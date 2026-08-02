import {
  getLocalizedAnalyticCategoryLabel,
  getLocalizedCardTitle,
  getLocalizedCategoryDisplayName,
  getLocalizedRecognitionSentence,
  normalizeCategoryKey
} from "@/lib/cards";
import type { DemoUser } from "@/lib/demo-data";

export function localizeDemoCardLabel(label: string, locale: string) {
  return getLocalizedCardTitle({ title: label }, locale);
}

export function localizeDemoCategoryLabel(label: string, locale: string) {
  return getLocalizedCategoryDisplayName(label, locale);
}

export function localizeDemoAnalyticLabel(label: string, locale: string) {
  return getLocalizedAnalyticCategoryLabel(label, locale);
}

export function localizeDemoPeople(people: DemoUser[], locale: string): DemoUser[] {
  return people.map((person) => ({
    ...person,
    topQuality: localizeDemoCardLabel(person.topQuality, locale)
  }));
}

export function localizeDemoQualityBars(
  items: Array<{ label: string; value: number; category: string }>,
  locale: string
) {
  return items.map((item) => ({
    ...item,
    label: localizeDemoCardLabel(item.label, locale),
    category: normalizeCategoryKey(item.category)
  }));
}

export function localizeDemoTopQualities(
  items: Array<{ label: string; tone: string; count: number }>,
  locale: string
) {
  return items.map((item) => ({
    ...item,
    label: localizeDemoCardLabel(item.label, locale)
  }));
}

export function localizeDemoDateLabel(date: string, locale: string) {
  if (locale !== "nl") return date;
  const map: Record<string, string> = {
    "2h ago": "2 u geleden",
    "1d ago": "1 dag geleden",
    "3d ago": "3 dagen geleden",
    Today: "Vandaag",
    Yesterday: "Gisteren"
  };
  return map[date] ?? date;
}

export function localizeDemoRecognitions(
  items: Array<{ id: string; from: string; to: string; card: string; category: string; note: string; date: string }>,
  locale: string
) {
  return items.map((item) => ({
    ...item,
    card: localizeDemoCardLabel(item.card, locale),
    category: localizeDemoCategoryLabel(item.category, locale),
    note: getLocalizedRecognitionSentence(item.card, locale) || item.note,
    date: localizeDemoDateLabel(item.date, locale)
  }));
}
