"use client";

import { useDeferredValue, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { GethCardVisual } from "@/components/GethCardVisual";
import { getCategoryDisplayName, type CardCategory, type GethCard } from "@/lib/cards";

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

function getCardSearchText(card: GethCard) {
  return normalizeSearchText(
    [
      card.cardNumber,
      card.title,
      card.category,
      getCategoryDisplayName(card.category),
      categorySearchAliases[card.category],
      card.description,
      card.recognitionSentence,
      card.slug
    ].join(" ")
  );
}

export function CardsLibraryClient({ cards }: { cards: GethCard[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | CardCategory>("all");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeSearchText(deferredQuery);
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);

  const visibleCards = cards.filter((card) => {
    const matchesCategory = category === "all" || card.category === category;
    const haystack = getCardSearchText(card);
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
          <a className="card-library-card" href={`/claim-card/${card.slug}`} key={card.slug}>
            <div className="card-library-copy">
              <div className="card-library-meta">
                <span>{getCategoryDisplayName(card.category)}</span>
                <span>{String(card.cardNumber).padStart(2, "0")}</span>
              </div>
              <GethCardVisual card={card} variant="library" />
              <div>
                <h3 className="panel-title" style={{ marginTop: 0 }}>
                  {card.title}
                </h3>
                <p>{card.description}</p>
                <p style={{ color: "var(--theme-ink)", fontWeight: 600 }}>{card.recognitionSentence}</p>
              </div>
              <span className="eyebrow" style={{ letterSpacing: "0.16em" }}>
                Claim this card <ArrowRight size={14} style={{ verticalAlign: "middle" }} />
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
