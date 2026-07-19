import { setRequestLocale } from "next-intl/server";
import { BookDemoForm } from "@/components/BookDemoForm";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";

export default async function BookDemoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PublicSiteChrome locale={locale}>
      <section className="section-shell page-shell">
        <div className="section-head">
          <div className="eyebrow">Book a demo</div>
          <h1 className="section-title">See GETH in a live company scenario</h1>
          <p className="section-copy">Walk through connected cards, claim flows, dashboards, and the signals your culture team can actually act on.</p>
        </div>
        <BookDemoForm />
      </section>
    </PublicSiteChrome>
  );
}
