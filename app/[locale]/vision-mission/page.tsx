/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";
import { BrandWordmark } from "@/components/BrandWordmark";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PageHero } from "@/components/ui/PageHero";

type VisionMissionPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: VisionMissionPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "visionPage" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription")
  };
}

export default async function VisionMissionPage({ params }: VisionMissionPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "visionPage" });

  return (
    <PublicSiteChrome locale={locale}>
      <PageHero eyebrow={<BrandWordmark />} title={t("title")} />
      <section className="lp-section-sm" style={{ paddingTop: 16, paddingBottom: 120 }}>
        <Container>
          <div className="lp-vision">
            <div className="lp-vision-photo lp-rv">
              <img className="lp-main" src="/assets/geth-recognition-moment.png" alt="" />
              <img className="lp-bird" src="/landing/geth-crest.svg" alt="" />
            </div>
            <div className="lp-doc">
              <article className="lp-doc-item lp-rv">
                <Eyebrow>01</Eyebrow>
                <h2>{t("visionHeading")}</h2>
                <p>{t("visionCopy")}</p>
              </article>

              <article className="lp-doc-item lp-rv">
                <Eyebrow>02</Eyebrow>
                <h2>{t("missionHeading")}</h2>
                <p>
                  {t("missionCopyBefore")}
                  <strong>{t("missionCards")}</strong>
                  {t("missionCopyAfter")}
                </p>
              </article>

              <article className="lp-doc-item lp-rv">
                <Eyebrow>03</Eyebrow>
                <h2>{t("meaningHeading")}</h2>
                <p>
                  {t("meaningCopyBefore")}
                  <strong>{t("meaningEmployee")}</strong>
                  {t("meaningJoin")}
                  <strong>{t("meaningEnvironment")}</strong>
                  {t("meaningCopyAfter")}
                </p>
                <p>{t("meaningBelief")}</p>
              </article>
            </div>
          </div>
        </Container>
      </section>
    </PublicSiteChrome>
  );
}
