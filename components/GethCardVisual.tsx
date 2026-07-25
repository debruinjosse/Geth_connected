import { BrandLogo } from "@/components/BrandLogo";
import { getCategoryDisplayName, type GethCard } from "@/lib/cards";

type GethCardVisualProps = {
  card: Pick<GethCard, "cardNumber" | "title" | "category" | "description" | "recognitionSentence">;
  variant?: "hero" | "claim" | "library";
};

export function GethCardVisual({ card, variant = "hero" }: GethCardVisualProps) {
  const category = getCategoryDisplayName(card.category);
  const compact = variant === "library";

  if (variant === "hero") {
    return (
      <article className="geth-card geth-card-hero">
        <div className="geth-card-hero-brand">
          <BrandLogo interactive={false} />
        </div>
        <div className="geth-card-hero-word">GETH</div>
        <div className="geth-card-hero-mark">Recognize to energize.</div>
        <div className="geth-card-hero-body">
          <div className="geth-card-hero-category">{category}</div>
          <h3>{card.title}</h3>
          <div className="geth-card-divider" />
          <p className="geth-card-description">{card.description}</p>
        </div>
      </article>
    );
  }

  return (
    <article className={`geth-card geth-card-${variant}`}>
      <div className="geth-card-header">
        <BrandLogo compact interactive={false} />
        <div className="geth-card-index">Card {String(card.cardNumber).padStart(2, "0")}</div>
      </div>

      <div className="geth-card-body">
        <div className="geth-card-badge">{category}</div>
        <h3>{card.title}</h3>
        <p className="geth-card-description">{card.description}</p>
        {!compact ? <p className="geth-card-quote">&ldquo;{card.recognitionSentence}&rdquo;</p> : null}
      </div>
    </article>
  );
}
