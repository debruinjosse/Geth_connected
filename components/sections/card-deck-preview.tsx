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

  const cardImageLocale = locale === "nl" ? "nl" : "en";
  const recognitionCards: RecognitionCardData[] = [
    {
      number: "01",
      category: text("previewCommunication"),
      categoryKind: "communication",
      title: text("previewListening"),
      description: text("previewListeningCopy"),
      image: `/cards/${cardImageLocale}/card_01_content.png`
    },
    {
      number: "02",
      category: text("previewCreativity"),
      categoryKind: "creativity",
      title: text("previewRenewing"),
      description: text("previewRenewingCopy"),
      image: `/cards/${cardImageLocale}/card_14_content.png`
    },
    {
      number: "03",
      category: text("previewCompetence"),
      categoryKind: "competence",
      title: text("previewGoalOriented"),
      description: text("previewGoalOrientedCopy"),
      image: `/cards/${cardImageLocale}/card_27_content.png`
    },
    {
      number: "04",
      category: text("previewCollegiality"),
      categoryKind: "collegiality",
      title: text("previewCaring"),
      description: text("previewCaringCopy"),
      image: `/cards/${cardImageLocale}/card_40_content.png`
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
