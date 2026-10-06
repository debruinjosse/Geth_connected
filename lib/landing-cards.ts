import type { RailCard } from "@/components/landing/CardRail";

type RailCategory = "com" | "cre" | "cmp" | "col";

/** Cards shown in the public previews: id → category + localized name. */
const RAIL_CARDS: ReadonlyArray<{ id: string; cat: RailCategory; nl: string; en: string }> = [
  { id: "01", cat: "com", nl: "Luisteraar", en: "Listener" },
  { id: "05", cat: "com", nl: "Empathisch", en: "Empathetic" },
  { id: "14", cat: "cre", nl: "Vernieuwend", en: "Innovative" },
  { id: "17", cat: "cre", nl: "Visionair", en: "Visionary" },
  { id: "27", cat: "cmp", nl: "Doelgericht", en: "Goal-oriented" },
  { id: "36", cat: "cmp", nl: "Resultaatgericht", en: "Results-oriented" },
  { id: "40", cat: "col", nl: "Zorgzaam", en: "Caring" },
  { id: "42", cat: "col", nl: "Teamspeler", en: "Team player" }
];

export function buildRailCards(lang: "nl" | "en", categoryLabels: Record<RailCategory, string>): RailCard[] {
  return RAIL_CARDS.map((card) => ({
    id: card.id,
    cat: card.cat,
    name: card[lang],
    category: categoryLabels[card.cat],
    src: `/landing/cards/${lang}/card_${card.id}_content.png`
  }));
}

export function railFilters(labels: { all: string; com: string; cre: string; cmp: string; col: string }) {
  return [
    { key: "all", label: labels.all },
    { key: "com", label: labels.com },
    { key: "cre", label: labels.cre },
    { key: "cmp", label: labels.cmp },
    { key: "col", label: labels.col }
  ];
}
