import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";

export default async function ResourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "resourcesPage" });
  const resources = [
    ["API", t("apiCopy"), t("apiAction")],
    [t("supportTitle"), t("supportCopy"), t("supportAction")]
  ];

  return (
    <PublicSiteChrome locale={locale}>
      <section className="section-shell page-shell">
        <div className="section-head">
          <div className="eyebrow">{t("eyebrow")}</div>
          <h1 className="section-title">{t("title")}</h1>
          <p className="section-copy">{t("copy")}</p>
        </div>
        <div className="audience-grid resources-card-grid">
          {resources.map(([title, copy, action]) => (
            <article className="audience-card" key={title}>
              <div className="eyebrow">{title}</div>
              <h3>{title}</h3>
              <p>{copy}</p>
              <Link href={`/${locale}/book-demo`} style={{ color: "var(--theme-ink)", fontWeight: 700 }}>
                {action}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </PublicSiteChrome>
  );
}
