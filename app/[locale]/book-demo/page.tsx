/* eslint-disable @next/next/no-img-element */
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookDemoForm } from "@/components/BookDemoForm";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";

export default async function BookDemoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "bookDemoPage" });
  const lang = locale === "nl" ? "nl" : "en";

  return (
    <PublicSiteChrome locale={locale}>
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        lead={t("copy")}
        decoration={<img className="lp-deco-card" src={`/landing/cards/${lang}/card_01_cover.png`} alt="" />}
      />
      <section className="lp-section-sm" style={{ paddingTop: 8, paddingBottom: 112 }}>
        <Container>
          <div className="lp-rv" style={{ maxWidth: 880 }}>
            <BookDemoForm />
          </div>
        </Container>
      </section>
    </PublicSiteChrome>
  );
}
