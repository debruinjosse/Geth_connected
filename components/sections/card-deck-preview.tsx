import { getTranslations } from "next-intl/server";
import { RecognitionCardCarousel, type RecognitionCardData } from "@/components/ui/recognition-card-carousel";
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

  const recognitionCards: RecognitionCardData[] = [
    {
      number: "01",
      category: text("previewCommunication"),
      title: text("previewListening"),
      description: text("previewListeningCopy")
    },
    {
      number: "02",
      category: text("previewCreativity"),
      title: text("previewRenewing"),
      description: text("previewRenewingCopy")
    },
    {
      number: "03",
      category: text("previewCompetence"),
      title: text("previewGoalOriented"),
      description: text("previewGoalOrientedCopy")
    },
    {
      number: "04",
      category: text("previewCollegiality"),
      title: text("previewCaring"),
      description: text("previewCaringCopy")
    }
  ];

  return (
    <section className="card-deck-preview" aria-labelledby="card-deck-preview-title">
      <div className="card-deck-preview-head">
        <div>
          <div className="eyebrow">{text("deckPreview")}</div>
          <h2 id="card-deck-preview-title">{text("deckPreviewTitle")}</h2>
          <p>{text("deckPreviewCopy")}</p>
        </div>
      </div>
      <RecognitionCardCarousel
        cards={recognitionCards}
        labels={{
          previous: text("previousCards"),
          next: text("nextCards")
        }}
      />
    </section>
  );
}
