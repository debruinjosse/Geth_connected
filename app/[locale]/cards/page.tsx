import { getTranslations, setRequestLocale } from "next-intl/server";
import { CardsLibraryClient } from "@/components/CardsLibraryClient";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";
import { getPublicCardLibrary } from "@/lib/card-library";

type CardsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CardsPage({ params }: CardsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "cardsPage" });
  const cards = await getPublicCardLibrary();

  return (
    <PublicSiteChrome ctaHref="/login" ctaLabel={t("cta")} locale={locale}>
      <section className="cards-page">
        <div className="cards-hero">
          <div className="eyebrow">{t("eyebrow")}</div>
          <h1 className="section-title">{t("title")}</h1>
          <p className="section-copy" style={{ maxWidth: 760 }}>
            {t("copy")}
          </p>
        </div>
        <section className="section-shell" style={{ paddingTop: 8 }}>
          <CardsLibraryClient cards={cards} />
        </section>
      </section>
    </PublicSiteChrome>
  );
}
