import { PublicSiteChrome } from "@/components/PublicSiteChrome";
import { LegalDocumentPage } from "@/components/LegalDocumentPage";
import { termsContent } from "@/lib/legal-content";

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
  },
  fr: {
    eyebrow: "Conditions generales",
    title: "Conditions generales GETH",
    subtitle: "Les conditions d'utilisation du site, de la plateforme, des produits et des services de reconnaissance connectee GETH.",
    effective: "Date d'entree en vigueur : a confirmer"
  },
  da: {
    eyebrow: "Vilkaar og betingelser",
    title: "GETH Vilkaar og betingelser",
    subtitle: "Vilkaarene for brug af GETH-websitet, platformen, produkterne og de forbundne anerkendelsestjenester.",
    effective: "Ikrafttraedelsesdato: bekraeftes senere"
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
        sections={termsContent}
      />
    </PublicSiteChrome>
  );
}
