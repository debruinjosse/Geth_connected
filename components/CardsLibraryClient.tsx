"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Gift, Search, Sparkles } from "lucide-react";
import { CardArtwork } from "@/components/CardArtwork";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Fields";
import { Panel } from "@/components/ui/Panel";
import {
  getCategoryDisplayName,
  getLocalizedCardDescription,
  getLocalizedCardTitle,
  getLocalizedCategoryDisplayName,
  getLocalizedRecognitionSentence,
  normalizeCategoryKey,
  type CardCategory,
  type GethCard
} from "@/lib/cards";

const categoryFilters: CardCategory[] = ["Communication", "Creativity", "Competence", "Collegiality", "Open Category"];

const categorySearchAliases: Record<string, string> = {
  Communication: "communication communicatie connector listener clear helder verbinder luisteraar",
  Creativity: "creativity creativiteit creative ideas maker improvisator",
  Competence: "competence competentie skill problem solver goal oriented doelgericht oplosser",
  Collegiality: "collegiality collegialiteit caring supportive team empathy empathisch",
  "Open Category": "open card open kaart open categorie custom"
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
      categorySearchAliases[normalizeCategoryKey(card.category)],
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

  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<CardCategory, number>> = {};

    for (const card of cards) {
      const key = normalizeCategoryKey(card.category) as CardCategory;
      counts[key] = (counts[key] ?? 0) + 1;
    }

    return counts;
  }, [cards]);

  const visibleCards = cards.filter((card) => {
    const matchesCategory =
      category === "all" || normalizeCategoryKey(card.category) === normalizeCategoryKey(category);
    const haystack = getCardSearchText(card, locale);
    const matchesQuery = queryTokens.length === 0 || queryTokens.every((token) => haystack.includes(token));
    return matchesCategory && matchesQuery;
  });

  const searchActive = normalizedQuery.length > 0 || category !== "all";
  const trimmedQuery = query.trim();
  const activeCategoryLabel =
    category === "all" ? null : getLocalizedCategoryDisplayName(category, locale);

  return (
    <>
      {giveIntent ? (
        <Alert tone="info" title={t("giveIntentTitle")}>
          {t("giveIntentCopy")}
        </Alert>
      ) : null}

      <div className="lp-library-bar">
        <div className="lp-filters" role="group" aria-label={t("filterAriaLabel")}>
          <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}>
            {t("filterAllCategories")} <small>{cards.length}</small>
          </button>
          {categoryFilters.map((value) => (
            <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)}>
              {getLocalizedCategoryDisplayName(value, locale)} <small>{categoryCounts[value] ?? 0}</small>
            </button>
          ))}
        </div>
        <div className="lp-input-icon lp-library-search">
          <Search aria-hidden="true" />
          <Input aria-label={t("searchAriaLabel")} placeholder={t("searchPlaceholder")} value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      </div>

      <p className="lp-hint lp-library-count">
        {category !== "all" && !trimmedQuery
          ? t("showingInCategory", { visible: visibleCards.length, category: activeCategoryLabel ?? category })
          : searchActive
            ? t("showingMatching", { visible: visibleCards.length, total: cards.length })
            : t("showingCount", { visible: visibleCards.length, total: cards.length })}
        {trimmedQuery ? ` ${t("searchFor", { query: trimmedQuery })}` : ""}
      </p>

      {visibleCards.length ? (
        <section className="lp-card-grid">
          {visibleCards.map((card, index) => {
            const cardHref = giveIntent ? `/${locale}/give-card/${card.slug}` : `/${locale}/claim-card/${card.slug}`;
            const title = getLocalizedCardTitle(card, locale);
            return (
              <a className="lp-cardtile" href={cardHref} key={card.slug}>
                <CardArtwork cardNumber={card.cardNumber} locale={locale} title={title} priority={index < 4} />
                <span className="lp-cardtile-meta">
                  <b>{title}</b>
                  <small>{getLocalizedCategoryDisplayName(card.category, locale)}</small>
                </span>
                <span className="lp-cardtile-cta">
                  {giveIntent ? <Gift aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                  {giveIntent ? t("giveThisCard") : t("cta")} <ArrowRight aria-hidden="true" />
                </span>
              </a>
            );
          })}
        </section>
      ) : (
        <Panel>
          <div className="lp-empty">
            <h3>{t("emptyTitle")}</h3>
            <p>{t("emptyCopy")}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
            >
              {t("clearSearch")}
            </Button>
          </div>
        </Panel>
      )}
    </>
  );
}
