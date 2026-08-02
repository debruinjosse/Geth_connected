"use client";

import { useDeferredValue, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Gift, Search, Sparkles } from "lucide-react";
import { GethCardVisual } from "@/components/GethCardVisual";
import {
  getCategoryDisplayName,
  getLocalizedCardDescription,
  getLocalizedCardTitle,
  getLocalizedCategoryDisplayName,
  getLocalizedRecognitionSentence,
  type CardCategory,
  type GethCard
} from "@/lib/cards";

const categoryFilters: CardCategory[] = ["Communicatie", "Creativiteit", "Competentie", "Collegialiteit", "Open kaart"];

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
      getLocalizedCardDescription(card, locale),
      card.recognitionSentence,
      getLocalizedRecognitionSentence(card, locale),
      card.slug
    ].join(" ")
  );
}

export function CardsLibraryClient({ cards }: { cards: GethCard[] }) {
  const locale = useLocale();
  const t = useTranslations("cardsPage");
  const searchParams = useSearchParams();
  const giveIntent = searchParams.get("intent") === "give";
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
  const trimmedQuery = query.trim();

  return (
    <>
      {giveIntent ? (
        <div className="cards-give-intent-banner" role="status">
          <strong>{t("giveIntentTitle")}</strong>
          <p>{t("giveIntentCopy")}</p>
        </div>
      ) : null}
      <section className="cards-filter-bar">
        <select
          className="input"
          aria-label={t("filterAriaLabel")}
          value={category}
          onChange={(event) => setCategory(event.target.value as "all" | CardCategory)}
        >
          <option value="all">{t("filterAllCategories")}</option>
          {categoryFilters.map((value) => (
            <option key={value} value={value}>
              {getLocalizedCategoryDisplayName(value, locale)}
            </option>
          ))}
        </select>
        <div className="input-wrap">
          <Search size={18} style={{ position: "absolute", top: 18, left: 16, color: "var(--theme-muted)" }} />
          <input
            aria-label={t("searchAriaLabel")}
            className="input"
            style={{ paddingLeft: 44 }}
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </section>

      <p className="cards-count">
        {searchActive
          ? t("showingMatching", { visible: visibleCards.length, total: cards.length })
          : t("showingCount", { visible: visibleCards.length, total: cards.length })}
        {trimmedQuery ? ` ${t("searchFor", { query: trimmedQuery })}` : ""}
      </p>

      {visibleCards.length ? (
        <section className="cards-grid">
          {visibleCards.map((card) => {
            const cardHref = giveIntent
              ? `/${locale}/give-card/${card.slug}`
              : `/${locale}/claim-card/${card.slug}`;
            return (
              <a className="card-library-card" href={cardHref} key={card.slug}>
                <div className="card-library-copy">
                  <GethCardVisual card={card} variant="library" />
                  <span className="card-library-action">
                    {giveIntent ? <Gift size={15} /> : <Sparkles size={15} />}
                    {giveIntent ? t("giveThisCard") : t("cta")} <ArrowRight size={14} />
                  </span>
                </div>
              </a>
            );
          })}
        </section>
      ) : (
        <section className="panel dashboard-panel cards-empty-search">
          <h2>{t("emptyTitle")}</h2>
          <p className="section-copy">{t("emptyCopy")}</p>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            {t("clearSearch")}
          </button>
        </section>
      )}
    </>
  );
}
