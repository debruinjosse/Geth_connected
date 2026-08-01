import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";
import { BrandWordmark } from "@/components/BrandWordmark";

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
      <section className="section-shell vision-page">
        <div className="pageContainer vision-page-inner">
          <div className="vision-document">
            <div className="eyebrow"><BrandWordmark /></div>
            <h1>{t("title")}</h1>

            <article>
              <h2>{t("visionHeading")}</h2>
              <p>{t("visionCopy")}</p>
            </article>

            <article>
              <h2>{t("missionHeading")}</h2>
              <p>
                {t("missionCopyBefore")}
                <strong>{t("missionCards")}</strong>
                {t("missionCopyAfter")}
              </p>
            </article>

            <article>
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
      </section>
    </PublicSiteChrome>
  );
}
