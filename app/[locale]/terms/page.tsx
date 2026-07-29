import { PublicSiteChrome } from "@/components/PublicSiteChrome";
import { LegalDocumentPage } from "@/components/LegalDocumentPage";
import { getTermsContent } from "@/lib/legal-content";

const copy = {
  en: {
    eyebrow: "Terms & Conditions",
    title: "GETH Terms & Conditions",
    subtitle: "The terms for using the GETH website, platform, products, and connected recognition services.",
    effective: "Effective date: to be confirmed"
  },
  nl: {
    eyebrow: "Algemene voorwaarden",
    title: "GETH Algemene voorwaarden",
    subtitle: "De voorwaarden voor het gebruik van de GETH-website, het platform, producten en connected recognition-diensten.",
    effective: "Ingangsdatum: nog te bevestigen"
  }
} as const;

export default async function TermsPage({ params }: { params: Promise<{ locale: keyof typeof copy }> }) {
  const { locale } = await params;
  const labels = copy[locale] ?? copy.en;

  return (
    <PublicSiteChrome locale={locale}>
      <LegalDocumentPage
        eyebrow={labels.eyebrow}
        title={labels.title}
        subtitle={labels.subtitle}
        effectiveDate={labels.effective}
        sections={getTermsContent(locale)}
      />
    </PublicSiteChrome>
  );
}
