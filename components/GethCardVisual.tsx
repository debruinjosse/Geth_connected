"use client";

import { useLocale, useTranslations } from "next-intl";
import { BrandLogo } from "@/components/BrandLogo";
import { BrandWordmark } from "@/components/BrandWordmark";
import {
  getLocalizedCategoryDisplayName,
  getLocalizedCardDescription,
  getLocalizedCardTitle,
  getLocalizedRecognitionSentence,
  type GethCard
} from "@/lib/cards";

type GethCardVisualProps = {
  card: Pick<GethCard, "cardNumber" | "title" | "category" | "description" | "recognitionSentence"> & Partial<Pick<GethCard, "slug">>;
  variant?: "hero" | "claim" | "library";
  locale?: string;
};

export function GethCardVisual({ card, variant = "hero", locale: localeProp }: GethCardVisualProps) {
  const locale = localeProp ?? useLocale();
  const t = useTranslations("common");
  const category = getLocalizedCategoryDisplayName(card.category, locale);
  const title = getLocalizedCardTitle({ title: card.title, slug: card.slug }, locale);
  const description = getLocalizedCardDescription(card, locale);
  const recognitionSentence = getLocalizedRecognitionSentence(card, locale);
  const compact = variant === "library";

  if (variant === "hero") {
    return (
      <article className="geth-card geth-card-hero">
        <div className="geth-card-hero-brand">
          <BrandLogo interactive={false} />
        </div>
        <div className="geth-card-hero-word"><BrandWordmark /></div>
        <div className="geth-card-hero-mark">{t("recognizeToEnergize")}</div>
        <div className="geth-card-hero-body">
          <div className="geth-card-hero-category">{category}</div>
          <h3>{title}</h3>
          <div className="geth-card-divider" />
          <p className="geth-card-description">{description}</p>
        </div>
      </article>
    );
  }

  return (
    <article className={`geth-card geth-card-${variant}`}>
      <div className="geth-card-header">
        <BrandLogo compact interactive={false} />
        <div className="geth-card-index">{t("cardNumberLabel", { number: String(card.cardNumber).padStart(2, "0") })}</div>
      </div>

      <div className="geth-card-body">
        <div className="geth-card-badge">{category}</div>
        <h3>{title}</h3>
        <p className="geth-card-description">{description}</p>
        {!compact ? <p className="geth-card-quote">&ldquo;{recognitionSentence}&rdquo;</p> : null}
      </div>
    </article>
  );
}
