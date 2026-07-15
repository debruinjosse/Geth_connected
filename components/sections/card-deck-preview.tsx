import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { RecognitionCardCarousel, type RecognitionCardData } from "@/components/ui/recognition-card-carousel";

export async function CardDeckPreview({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home" });

  const recognitionCards: RecognitionCardData[] = [
    {
      number: "01",
      category: t("previewCommunication"),
      title: t("previewListening"),
      description: t("previewListeningCopy")
    },
    {
      number: "02",
      category: t("previewCreativity"),
      title: t("previewRenewing"),
      description: t("previewRenewingCopy")
    },
    {
      number: "03",
      category: t("previewCompetence"),
      title: t("previewGoalOriented"),
      description: t("previewGoalOrientedCopy")
    },
    {
      number: "04",
      category: t("previewCollegiality"),
      title: t("previewCaring"),
      description: t("previewCaringCopy")
    }
  ];

  return (
    <section className="card-deck-preview" aria-labelledby="card-deck-preview-title">
      <div className="card-deck-preview-head">
        <div>
          <div className="eyebrow">{t("deckPreview")}</div>
          <h2 id="card-deck-preview-title">{t("deckPreviewTitle")}</h2>
          <p>{t("deckPreviewCopy")}</p>
        </div>
        <Link className="card-deck-preview-link" href="/cards">
          {t("viewAllCards")} <ArrowRight size={15} />
        </Link>
      </div>
      <RecognitionCardCarousel
        cards={recognitionCards}
        labels={{
          previous: t("previousCards"),
          next: t("nextCards")
        }}
      />
    </section>
  );
}
