import {
  DEFAULT_MARQUEE_ITEMS_EN,
  DEFAULT_MARQUEE_ITEMS_NL
} from "@/lib/marquee-config";

export const DEFAULT_TESTIMONIALS_EN = [
  {
    quote: "GETH helped our managers see recognition patterns we were missing.",
    name: "Sarah van den Berg",
    role: "HR Director"
  },
  {
    quote: "Our team finally has a simple way to make appreciation visible every week.",
    name: "Mark Kim",
    role: "Team Manager"
  },
  {
    quote: "The cards create real conversations — not just another digital badge.",
    name: "Aisha Verma",
    role: "People & Culture Lead"
  }
];

export const DEFAULT_TESTIMONIALS_NL = [
  {
    quote: "GETH hielp onze managers waarderingspatronen zien die we misten.",
    name: "Sarah van den Berg",
    role: "HR-directeur"
  },
  {
    quote: "Ons team heeft eindelijk een simpele manier om waardering elke week zichtbaar te maken.",
    name: "Mark Kim",
    role: "Teammanager"
  },
  {
    quote: "De kaarten zorgen voor echte gesprekken — niet nog een digitale badge.",
    name: "Aisha Verma",
    role: "People & Culture Lead"
  }
];

export function getDefaultTestimonialsForLocale(locale: string) {
  return locale === "nl" ? DEFAULT_TESTIMONIALS_NL : DEFAULT_TESTIMONIALS_EN;
}

export function getDefaultMarqueeItemsSerialized(locale: string) {
  const items = locale === "nl" ? DEFAULT_MARQUEE_ITEMS_NL : DEFAULT_MARQUEE_ITEMS_EN;
  return JSON.stringify(items);
}

export type TestimonialItem = {
  quote: string;
  name: string;
  role: string;
};

export function parseTestimonialItems(raw: string | undefined): TestimonialItem[] {
  if (!raw?.trim()) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const record = item as Record<string, string>;
        const quote = String(record.quote ?? "").trim();
        const name = String(record.name ?? "").trim();
        const role = String(record.role ?? "").trim();
        if (!quote) return null;
        return { quote, name, role };
      })
      .filter((item): item is TestimonialItem => item !== null);
  } catch {
    return [];
  }
}
