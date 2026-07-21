import { setRequestLocale } from "next-intl/server";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";
import { PricingPlansClient, type PricingTier } from "@/components/PricingPlansClient";

type PricingCopy = {
  eyebrow: string;
  title: string;
  labels: {
    monthly: string;
    yearly: string;
    yearlySubcopy: string;
    bestValue: string;
    contact: string;
    perEmployee: string;
    customPricing: string;
    mostPopular: string;
  };
  tiers: PricingTier[];
};

const pricingCopy: Record<string, PricingCopy> = {
  en: {
    eyebrow: "Pricing",
    title: "Choose the plan that fits your team and start making recognition visible.",
    labels: {
      monthly: "Monthly",
      yearly: "Yearly",
      yearlySubcopy: "Save up to 20%",
      bestValue: "Best value",
      contact: "Contact us",
      perEmployee: "/month per employee",
      customPricing: "Custom pricing",
      mostPopular: "Most popular"
    },
    tiers: [
      {
        name: "Starter",
        monthly: "€19",
        yearly: "€15",
        icon: "team",
        features: ["Up to 50 employees", "Personal recognition dashboard", "Connected cards experience", "Basic analytics", "Email support"]
      },
      {
        name: "Growth",
        monthly: "€29",
        yearly: "€23",
        icon: "growth",
        featured: true,
        features: ["Up to 50 employees", "Personal recognition dashboard", "Connected cards experience", "Advanced analytics", "Email/WhatsApp support", "Manager insights", "Organisation insights", "Recognition reports"]
      },
      {
        name: "Enterprise",
        monthly: "Custom",
        yearly: "Custom",
        icon: "enterprise",
        features: ["For larger organizations", "Unlimited employees", "Personal recognition dashboard", "Connected cards experience", "Advanced analytics", "Manager insights", "Organisation insights", "Recognition reports", "SSO & integrations", "Dedicated support"]
      }
    ]
  },
  nl: {
    eyebrow: "Prijzen",
    title: "Kies het pakket dat bij je team past en maak erkenning zichtbaar.",
    labels: {
      monthly: "Maandelijks",
      yearly: "Jaarlijks",
      yearlySubcopy: "Bespaar tot 20%",
      bestValue: "Beste waarde",
      contact: "Contact",
      perEmployee: "/maand per medewerker",
      customPricing: "Prijs op maat",
      mostPopular: "Meest gekozen"
    },
    tiers: [
      {
        name: "Starter",
        monthly: "€19",
        yearly: "€15",
        icon: "team",
        features: ["Tot 50 medewerkers", "Persoonlijk erkenningsdashboard", "Connected cards ervaring", "Basisanalytics", "E-mailsupport"]
      },
      {
        name: "Growth",
        monthly: "€29",
        yearly: "€23",
        icon: "growth",
        featured: true,
        features: ["Tot 50 medewerkers", "Persoonlijk erkenningsdashboard", "Connected cards ervaring", "Geavanceerde analytics", "E-mail/WhatsApp-support", "Managerinzichten", "Organisatie-inzichten", "Erkenningsrapporten"]
      },
      {
        name: "Enterprise",
        monthly: "Custom",
        yearly: "Custom",
        icon: "enterprise",
        features: ["Voor grotere organisaties", "Onbeperkt medewerkers", "Persoonlijk erkenningsdashboard", "Connected cards ervaring", "Geavanceerde analytics", "Managerinzichten", "Organisatie-inzichten", "Erkenningsrapporten", "SSO & integraties", "Dedicated support"]
      }
    ]
  },
  fr: {
    eyebrow: "Tarifs",
    title: "Choisissez le plan qui convient a votre equipe et rendez la reconnaissance visible.",
    labels: {
      monthly: "Mensuel",
      yearly: "Annuel",
      yearlySubcopy: "Economisez jusqu'a 20%",
      bestValue: "Meilleure valeur",
      contact: "Contactez-nous",
      perEmployee: "/mois par employe",
      customPricing: "Tarif sur mesure",
      mostPopular: "Le plus populaire"
    },
    tiers: [
      {
        name: "Starter",
        monthly: "€19",
        yearly: "€15",
        icon: "team",
        features: ["Jusqu'a 50 employes", "Tableau de bord personnel de reconnaissance", "Experience connected cards", "Analytics de base", "Support email"]
      },
      {
        name: "Growth",
        monthly: "€29",
        yearly: "€23",
        icon: "growth",
        featured: true,
        features: ["Jusqu'a 50 employes", "Tableau de bord personnel de reconnaissance", "Experience connected cards", "Analytics avancees", "Support email/WhatsApp", "Insights managers", "Insights organisation", "Rapports de reconnaissance"]
      },
      {
        name: "Enterprise",
        monthly: "Custom",
        yearly: "Custom",
        icon: "enterprise",
        features: ["Pour les grandes organisations", "Employes illimites", "Tableau de bord personnel de reconnaissance", "Experience connected cards", "Analytics avancees", "Insights managers", "Insights organisation", "Rapports de reconnaissance", "SSO & integrations", "Support dedie"]
      }
    ]
  },
  da: {
    eyebrow: "Priser",
    title: "Vaelg planen der passer til dit team, og goer anerkendelse synlig.",
    labels: {
      monthly: "Maanedlig",
      yearly: "Aarlig",
      yearlySubcopy: "Spar op til 20%",
      bestValue: "Bedste vaerdi",
      contact: "Kontakt os",
      perEmployee: "/maaned pr. medarbejder",
      customPricing: "Tilpasset pris",
      mostPopular: "Mest populaer"
    },
    tiers: [
      {
        name: "Starter",
        monthly: "€19",
        yearly: "€15",
        icon: "team",
        features: ["Op til 50 medarbejdere", "Personligt anerkendelsesdashboard", "Connected cards oplevelse", "Basisanalytics", "E-mailsupport"]
      },
      {
        name: "Growth",
        monthly: "€29",
        yearly: "€23",
        icon: "growth",
        featured: true,
        features: ["Op til 50 medarbejdere", "Personligt anerkendelsesdashboard", "Connected cards oplevelse", "Avanceret analytics", "Email/WhatsApp-support", "Managerindsigter", "Organisationsindsigter", "Anerkendelsesrapporter"]
      },
      {
        name: "Enterprise",
        monthly: "Custom",
        yearly: "Custom",
        icon: "enterprise",
        features: ["For stoerre organisationer", "Ubegraensede medarbejdere", "Personligt anerkendelsesdashboard", "Connected cards oplevelse", "Avanceret analytics", "Managerindsigter", "Organisationsindsigter", "Anerkendelsesrapporter", "SSO & integrationer", "Dedikeret support"]
      }
    ]
  }
};

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const copy = pricingCopy[locale] ?? pricingCopy.en;

  return (
    <PublicSiteChrome locale={locale}>
      <section className="section-shell page-shell pricing-page-shell">
        <div className="section-head pricing-hero-copy">
          <div className="eyebrow">{copy.eyebrow}</div>
          <h1 className="section-title">{copy.title}</h1>
          <span className="pricing-title-mark" aria-hidden="true" />
        </div>
        <PricingPlansClient tiers={copy.tiers} labels={copy.labels} locale={locale} />
      </section>
    </PublicSiteChrome>
  );
}
