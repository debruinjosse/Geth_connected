"use client";

import { useDeferredValue, useState } from "react";
import { useLocale } from "next-intl";
import { ArrowRight, Gift, Search } from "lucide-react";
import { GethCardVisual } from "@/components/GethCardVisual";
import { getCategoryDisplayName, getLocalizedCardTitle, getLocalizedCategoryDisplayName, type CardCategory, type GethCard } from "@/lib/cards";

const filters: Array<{ value: "all" | CardCategory; label: string }> = [
  { value: "all", label: "All categories" },
  { value: "Communicatie", label: "Communication" },
  { value: "Creativiteit", label: "Creativity" },
  { value: "Competentie", label: "Competence" },
  { value: "Collegialiteit", label: "Collegiality" },
  { value: "Open kaart", label: "Open Card" }
];

const categorySearchAliases: Record<string, string> = {
  Communicatie: "communication communicatie connector listener clear helder verbinder luisteraar",
  Creativiteit: "creativity creativiteit creative ideas maker improvisator",
  Competentie: "competence competentie skill problem solver goal oriented doelgericht oplosser",
  Collegialiteit: "collegiality collegialiteit caring supportive team empathy empathisch",
  "Open kaart": "open card open kaart open categorie custom"
};

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_/]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCardSearchText(card: GethCard, locale: string) {
  return normalizeSearchText(
    [
      card.cardNumber,
      card.title,
      getLocalizedCardTitle(card, locale),
      card.category,
      getCategoryDisplayName(card.category),
      getLocalizedCategoryDisplayName(card.category, locale),
      categorySearchAliases[card.category],
      card.description,
      card.recognitionSentence,
      card.slug
    ].join(" ")
  );
}

export function CardsLibraryClient({ cards }: { cards: GethCard[] }) {
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | CardCategory>("all");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeSearchText(deferredQuery);
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);

  const visibleCards = cards.filter((card) => {
    const matchesCategory = category === "all" || card.category === category;
    const haystack = getCardSearchText(card, locale);
    const matchesQuery = queryTokens.length === 0 || queryTokens.every((token) => haystack.includes(token));
    return matchesCategory && matchesQuery;
  });

  const searchActive = normalizedQuery.length > 0 || category !== "all";

  return (
    <>
      <section className="cards-filter-bar">
        <select className="input" aria-label="Filter cards by category" value={category} onChange={(event) => setCategory(event.target.value as "all" | CardCategory)}>
          {filters.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
        <div className="input-wrap">
          <Search size={18} style={{ position: "absolute", top: 18, left: 16, color: "var(--theme-muted)" }} />
          <input
            aria-label="Search cards"
            className="input"
            style={{ paddingLeft: 44 }}
            placeholder="Search by title, category, quality, card number, or phrase"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </section>

      <p className="cards-count">
        {searchActive ? `Showing ${visibleCards.length} matching cards out of ${cards.length}` : `Showing ${visibleCards.length} of ${cards.length} cards`}
        {normalizedQuery ? ` for "${query.trim()}"` : ""}
      </p>

      {visibleCards.length ? (
        <section className="cards-grid">
          {visibleCards.map((card) => (
            <a className="card-library-card" href={`/${locale}/claim-card/${card.slug}`} key={card.slug}>
              <div className="card-library-copy">
                <GethCardVisual card={{ ...card, title: getLocalizedCardTitle(card, locale), category: getLocalizedCategoryDisplayName(card.category, locale) }} variant="library" />
                <span className="card-library-action">
                  <Gift size={15} />
                  Give this card <ArrowRight size={14} />
                </span>
              </div>
            </a>
          ))}
        </section>
      ) : (
        <section className="panel dashboard-panel cards-empty-search">
          <h2>No cards found</h2>
          <p className="section-copy">Try a broader word like communication, empathy, problem solver, clear, or a card number.</p>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            Clear search
          </button>
        </section>
      )}
    </>
  );
}
