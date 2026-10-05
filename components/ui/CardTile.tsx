import { Ear, Sparkles, Target, HeartHandshake } from "lucide-react";

export type CardTileCategory = "communication" | "creativity" | "competence" | "collegiality";

export type CardTileData = {
  index: string;
  category: string;
  categoryKind: CardTileCategory;
  title: string;
  description: string;
};

const iconByCategory = {
  communication: Ear,
  creativity: Sparkles,
  competence: Target,
  collegiality: HeartHandshake
} as const;

export function CardTile({ card }: { card: CardTileData }) {
  const Icon = iconByCategory[card.categoryKind];

  return (
    <article className="gt-card-tile">
      <div className="gt-card-tile-head">
        <span className={`gt-cat-dot gt-cat-dot-${card.categoryKind}`} aria-hidden="true" />
        <span className="gt-card-tile-category">{card.category}</span>
      </div>
      <Icon className="gt-card-tile-icon" size={28} strokeWidth={1.5} aria-hidden="true" />
      <h3>{card.title}</h3>
      <p>{card.description}</p>
      <span className="gt-card-tile-index" aria-hidden="true">{card.index}</span>
    </article>
  );
}
