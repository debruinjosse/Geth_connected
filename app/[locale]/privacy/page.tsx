import { PublicSiteChrome } from "@/components/PublicSiteChrome";
import { LegalDocumentPage } from "@/components/LegalDocumentPage";
import { getPrivacyContent } from "@/lib/legal-content";

const copy = {
  en: {
    eyebrow: "Privacy Policy",
    title: "GETH Privacy Policy",
    subtitle: "How GETH collects, uses, stores, shares, and protects personal data.",
    effective: "Effective date: to be confirmed"
  },
  nl: {
    eyebrow: "Privacybeleid",
    title: "GETH Privacybeleid",
    subtitle: "Hoe GETH persoonsgegevens verzamelt, gebruikt, bewaart, deelt en beschermt.",
    effective: "Ingangsdatum: nog te bevestigen"
  }
} as const;

export default async function PrivacyPage({ params }: { params: Promise<{ locale: keyof typeof copy }> }) {
  const { locale } = await params;
  const labels = copy[locale] ?? copy.en;

  return (
    <PublicSiteChrome locale={locale}>
      <LegalDocumentPage
        eyebrow={labels.eyebrow}
        title={labels.title}
        subtitle={labels.subtitle}
        effectiveDate={labels.effective}
        sections={getPrivacyContent(locale)}
      />
    </PublicSiteChrome>
  );
}
