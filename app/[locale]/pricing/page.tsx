import { setRequestLocale } from "next-intl/server";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";
import { PricingPlansClient, type PricingTier } from "@/components/PricingPlansClient";

type PricingContent = {
  titleLine1: string;
  titleLine2: string;
  labels: {
    monthly: string;
    monthlySubcopy: string;
    yearly: string;
    yearlySubcopy: string;
    bestValue: string;
    billingPeriod: string;
    customPrice: string;
  };
  tiers: PricingTier[];
  trust: Array<{ title: string; copy: string }>;
};

const pricingContent: Record<string, PricingContent> = {
  en: {
    titleLine1: "Simple plans.",
    titleLine2: "Stronger cultures.",
    labels: {
      monthly: "Monthly",
      monthlySubcopy: "Pay as you go",
      yearly: "Yearly",
      yearlySubcopy: "Save up to 20%",
      bestValue: "Best value",
      billingPeriod: "Billing period",
      customPrice: "Custom"
    },
    tiers: [
      {
        name: "GROWTH",
        monthly: "€ 11,99",
        yearly: "€ 9,59",
        icon: "growth",
        kind: "growth",
        description: "For growing teams building a strong culture.",
        features: [
          "Up to 50 employees",
          "Unlimited recognition cards",
          "Advanced analytics",
          "Manager insights",
          "Company Insights",
          "Priority support"
        ],
        cta: "Get started",
        ctaHref: "/signup?role=company_admin"
      },
      {
        name: "CUSTOM",
        monthly: "Custom",
        yearly: "Custom",
        icon: "enterprise",
        kind: "custom",
        description: "For organizations with more than 50 employees driving culture at scale.",
        features: [
          "More than 50 employees",
          "Unlimited recognition cards",
          "Advanced analytics",
          "Manager insights",
          "Company Insights",
          "SSO & integrations",
          "API access",
          "Dedicated support"
        ],
        cta: "Contact us",
        ctaHref: "/book-demo"
      }
    ],
    trust: [
      {
        title: "Privacy first",
        copy: "GDPR compliant & hosted in Europe."
      },
      {
        title: "Easy to implement",
        copy: "Up and running in minutes."
      },
      {
        title: "Personal support",
        copy: "Direct contact with our team."
      }
    ]
  },
  nl: {
    titleLine1: "Eenvoudige prijzen.",
    titleLine2: "Sterkere culturen.",
    labels: {
      monthly: "Maandelijks",
      monthlySubcopy: "Flexibel betalen",
      yearly: "Jaarlijks",
      yearlySubcopy: "Bespaar tot 20%",
      bestValue: "Beste prijs",
      billingPeriod: "Facturatieperiode",
      customPrice: "Maatwerk"
    },
    tiers: [
      {
        name: "GROEI",
        monthly: "€ 11,99",
        yearly: "€ 9,59",
        icon: "growth",
        kind: "growth",
        description: "Voor groeiende teams die bouwen aan een sterke waarderingscultuur.",
        features: [
          "Tot 50 medewerkers",
          "Onbeperkt waarderingskaarten versturen",
          "Geavanceerde analyses",
          "Inzichten voor leidinggevenden",
          "Company Insights",
          "Prioriteitssupport"
        ],
        cta: "Start direct",
        ctaHref: "/signup?role=company_admin"
      },
      {
        name: "MAATWERK",
        monthly: "Maatwerk",
        yearly: "Maatwerk",
        icon: "enterprise",
        kind: "custom",
        description: "Voor organisaties met meer dan 50 medewerkers die waardering organisatiebreed willen inzetten.",
        features: [
          "Meer dan 50 medewerkers",
          "Onbeperkt waarderingskaarten versturen",
          "Geavanceerde analyses",
          "Inzichten voor leidinggevenden",
          "Company Insights",
          "SSO & integraties",
          "API-toegang",
          "Dedicated support"
        ],
        cta: "Neem contact op",
        ctaHref: "/book-demo"
      }
    ],
    trust: [
      {
        title: "Privacy first",
        copy: "AVG-compliant & gehost in Europa."
      },
      {
        title: "Snel en eenvoudig",
        copy: "Binnen enkele minuten actief in jouw organisatie."
      },
      {
        title: "Persoonlijke support",
        copy: "Direct contact met ons team."
      }
    ]
  }
};

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const copy = pricingContent[locale] ?? pricingContent.en;

  return (
    <PublicSiteChrome locale={locale}>
      <section className="section-shell page-shell pricing-page-shell">
        <div className="section-head pricing-hero-copy">
          <h1 className="section-title pricing-hero-title">
            {copy.titleLine1} <span className="pricing-hero-accent">{copy.titleLine2}</span>
          </h1>
        </div>
        <PricingPlansClient tiers={copy.tiers} labels={copy.labels} trustItems={copy.trust} />
      </section>
    </PublicSiteChrome>
  );
}
