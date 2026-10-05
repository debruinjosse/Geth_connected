import { getTranslations } from "next-intl/server";
import { CardCarousel } from "@/components/ui/CardCarousel";
import type { CardTileData } from "@/components/ui/CardTile";
import { pickSiteContentText } from "@/lib/site-content";

export async function CardDeckPreview({
  locale,
  overrides = {}
}: {
  locale: string;
  overrides?: Record<string, string>;
}) {
  const t = await getTranslations({ locale, namespace: "home" });
  const text = (key: string) => pickSiteContentText(overrides, t(key), key);

  const cards: CardTileData[] = [
    {
      index: "01",
      category: text("previewCommunication"),
      categoryKind: "communication",
      title: text("previewListening"),
      description: text("previewListeningCopy")
    },
    {
      index: "02",
      category: text("previewCreativity"),
      categoryKind: "creativity",
      title: text("previewRenewing"),
      description: text("previewRenewingCopy")
    },
    {
      index: "03",
      category: text("previewCompetence"),
      categoryKind: "competence",
      title: text("previewGoalOriented"),
      description: text("previewGoalOrientedCopy")
    },
    {
      index: "04",
      category: text("previewCollegiality"),
      categoryKind: "collegiality",
      title: text("previewCaring"),
      description: text("previewCaringCopy")
    }
  ];

  return (
    <section className="gt-section gt-section-default gt-card-preview" aria-labelledby="card-deck-preview-title">
      <div className="gt-container">
        <div className="gt-section-header gt-section-header-left">
          <h2 id="card-deck-preview-title">{text("deckPreviewTitle")}</h2>
          <p className="gt-section-lead">{text("deckPreviewCopy")}</p>
        </div>
        <CardCarousel
          cards={cards}
          labels={{
            previous: text("previousCards"),
            next: text("nextCards")
          }}
        />
      </div>
    </section>
  );
}
