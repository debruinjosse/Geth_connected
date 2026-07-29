import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookDemoForm } from "@/components/BookDemoForm";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";

export default async function BookDemoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "bookDemoPage" });

  return (
    <PublicSiteChrome locale={locale}>
      <section className="section-shell page-shell">
        <div className="section-head">
          <div className="eyebrow">{t("eyebrow")}</div>
          <h1 className="section-title">{t("title")}</h1>
          <p className="section-copy">{t("copy")}</p>
        </div>
        <BookDemoForm />
      </section>
    </PublicSiteChrome>
  );
}
