import { PublicSiteChrome } from "@/components/PublicSiteChrome";
import { PricingPlansClient, type PricingTier } from "@/components/PricingPlansClient";

type PricingCopy = {
  eyebrow: string;
  title: string;
  copy: string;
  labels: {
    monthly: string;
    yearly: string;
    choose: string;
    custom: string;
    perMonth: string;
    perYear: string;
    invoiceNote: string;
  };
  tiers: PricingTier[];
};

const pricingCopy: Record<string, PricingCopy> = {
  en: {
    eyebrow: "Pricing",
    title: "Plans for recognition cultures at every stage",
    copy: "Choose monthly flexibility or yearly invoice-based billing for European rollouts.",
    labels: {
      monthly: "Monthly",
      yearly: "Yearly",
      choose: "Choose",
      custom: "Custom",
      perMonth: "per month",
      perYear: "per year",
      invoiceNote: "European customers can request generated invoice PDFs with VAT, due date, payment reference, and bank-transfer details from the company billing portal."
    },
    tiers: [
      {
        name: "Starter",
        monthly: "EUR 12",
        yearly: "EUR 120",
        yearlyNote: "Save 2 months",
        blurb: "For small teams proving recognition habits.",
        features: ["Connected cards starter deck", "Employee dashboard", "Basic claim analytics"]
      },
      {
        name: "Growth",
        monthly: "EUR 29",
        yearly: "EUR 290",
        yearlyNote: "Save 2 months",
        blurb: "For growing companies that want manager and company insights.",
        features: ["Manager workspace", "Signals and reports", "Cards and decks management"],
        featured: true
      },
      {
        name: "Enterprise",
        monthly: "Custom",
        yearly: "Custom",
        yearlyNote: "Annual agreement",
        blurb: "For multi-team organizations and enterprise rollouts.",
        features: ["Advanced admin controls", "Custom card programs", "Priority onboarding and support"]
      }
    ]
  },
  nl: {
    eyebrow: "Prijzen",
    title: "Pakketten voor waarderingsculturen in elke fase",
    copy: "Kies maandelijkse flexibiliteit of jaarlijkse facturatie voor Europese uitrol.",
    labels: {
      monthly: "Maandelijks",
      yearly: "Jaarlijks",
      choose: "Kies",
      custom: "Op maat",
      perMonth: "per maand",
      perYear: "per jaar",
      invoiceNote: "Europese klanten kunnen gegenereerde factuur-PDF's met btw, vervaldatum, betalingsreferentie en bankoverschrijving aanvragen via het bedrijfsportaal."
    },
    tiers: [
      {
        name: "Starter",
        monthly: "EUR 12",
        yearly: "EUR 120",
        yearlyNote: "Bespaar 2 maanden",
        blurb: "Voor kleine teams die waarderingsgewoonten willen opbouwen.",
        features: ["Connected cards starterdeck", "Medewerkersdashboard", "Basisanalyses voor claims"]
      },
      {
        name: "Growth",
        monthly: "EUR 29",
        yearly: "EUR 290",
        yearlyNote: "Bespaar 2 maanden",
        blurb: "Voor groeiende bedrijven die manager- en bedrijfsinzichten willen.",
        features: ["Managerworkspace", "Signalen en rapporten", "Beheer van kaarten en decks"],
        featured: true
      },
      {
        name: "Enterprise",
        monthly: "Op maat",
        yearly: "Op maat",
        yearlyNote: "Jaarovereenkomst",
        blurb: "Voor organisaties met meerdere teams en enterprise-uitrol.",
        features: ["Geavanceerde beheerfuncties", "Programma's met maatwerkkaarten", "Prioritaire onboarding en support"]
      }
    ]
  },
  fr: {
    eyebrow: "Tarifs",
    title: "Des offres pour chaque etape de votre culture de reconnaissance",
    copy: "Choisissez la flexibilite mensuelle ou la facturation annuelle par invoice pour les deploiements europeens.",
    labels: {
      monthly: "Mensuel",
      yearly: "Annuel",
      choose: "Choisir",
      custom: "Sur mesure",
      perMonth: "par mois",
      perYear: "par an",
      invoiceNote: "Les clients europeens peuvent generer des PDF de facture avec TVA, date d'echeance, reference de paiement et details de virement depuis le portail entreprise."
    },
    tiers: [
      {
        name: "Starter",
        monthly: "EUR 12",
        yearly: "EUR 120",
        yearlyNote: "2 mois offerts",
        blurb: "Pour les petites equipes qui installent les habitudes de reconnaissance.",
        features: ["Deck de demarrage de cartes connectees", "Tableau de bord employe", "Analyses de base des claims"]
      },
      {
        name: "Growth",
        monthly: "EUR 29",
        yearly: "EUR 290",
        yearlyNote: "2 mois offerts",
        blurb: "Pour les entreprises en croissance qui veulent des insights managers et entreprise.",
        features: ["Espace manager", "Signaux et rapports", "Gestion des cartes et decks"],
        featured: true
      },
      {
        name: "Enterprise",
        monthly: "Sur mesure",
        yearly: "Sur mesure",
        yearlyNote: "Contrat annuel",
        blurb: "Pour les organisations multi-equipes et les deploiements enterprise.",
        features: ["Controles admin avances", "Programmes de cartes personnalisees", "Onboarding et support prioritaires"]
      }
    ]
  },
  da: {
    eyebrow: "Priser",
    title: "Planer til anerkendelseskulturer i alle faser",
    copy: "Vaelg maanedlig fleksibilitet eller aarlig fakturering til europaeiske udrulninger.",
    labels: {
      monthly: "Maanedlig",
      yearly: "Aarlig",
      choose: "Vaelg",
      custom: "Tilpasset",
      perMonth: "pr. maaned",
      perYear: "pr. aar",
      invoiceNote: "Europaeiske kunder kan generere faktura-PDF'er med moms, forfaldsdato, betalingsreference og bankoverfoerselsoplysninger fra virksomhedsportalen."
    },
    tiers: [
      {
        name: "Starter",
        monthly: "EUR 12",
        yearly: "EUR 120",
        yearlyNote: "Spar 2 maaneder",
        blurb: "For smaa teams, der vil opbygge anerkendelsesvaner.",
        features: ["Connected cards startdeck", "Medarbejderdashboard", "Grundlaeggende claim-analyse"]
      },
      {
        name: "Growth",
        monthly: "EUR 29",
        yearly: "EUR 290",
        yearlyNote: "Spar 2 maaneder",
        blurb: "For voksende virksomheder, der vil have manager- og virksomhedsindsigt.",
        features: ["Managerworkspace", "Signaler og rapporter", "Administration af kort og decks"],
        featured: true
      },
      {
        name: "Enterprise",
        monthly: "Tilpasset",
        yearly: "Tilpasset",
        yearlyNote: "Aarlig aftale",
        blurb: "For organisationer med flere teams og enterprise-udrulning.",
        features: ["Avancerede admin-kontroller", "Tilpassede kortprogrammer", "Prioriteret onboarding og support"]
      }
    ]
  }
};

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const copy = pricingCopy[locale] ?? pricingCopy.en;

  return (
    <PublicSiteChrome locale={locale}>
      <section className="section-shell page-shell">
        <div className="section-head">
          <div className="eyebrow">{copy.eyebrow}</div>
          <h1 className="section-title">{copy.title}</h1>
          <p className="section-copy">{copy.copy}</p>
        </div>
        <PricingPlansClient tiers={copy.tiers} labels={copy.labels} locale={locale} />
      </section>
    </PublicSiteChrome>
  );
}
