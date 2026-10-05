import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SimpleDashboardMockup } from "@/components/SimpleDashboardMockup";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/Button";
import { SocialProofStrip } from "@/components/SocialProofStrip";
import { AudienceCard } from "@/components/ui/AudienceCard";
import { RECOGNITION_MOMENT_ALT, RECOGNITION_MOMENT_SRC } from "@/lib/brand";
import { resolveHeroHeadlineLines, splitHeadlinePhrase } from "@/lib/landing-hero-headline";
import { getSiteContentOverrides, pickSiteContentText } from "@/lib/site-content";
import { CardDeckPreview } from "@/components/sections/card-deck-preview";
import { HowItWorksDeckSection } from "@/components/sections/HowItWorksDeckSection";

type LandingPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LandingPage({ params }: LandingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });
  const nav = await getTranslations({ locale, namespace: "nav" });
  const overrides = await getSiteContentOverrides("home", locale);
  const text = (key: string) => pickSiteContentText(overrides, t(key), key);

  const audiences = [
    [text("companiesLabel"), text("companiesTitle"), text("companiesCopy")],
    [text("managersLabel"), text("managersTitle"), text("managersCopy")],
    [text("employeesLabel"), text("employeesTitle"), text("employeesCopy")]
  ] as const;

  const howItWorksContent = {
    title: text("howItWorksTitle"),
    steps: {
      pickCard: { title: text("stepPickCardTitle"), description: text("stepPickCardDescription") },
      giveSpeak: { title: text("stepGiveSpeakTitle"), description: text("stepGiveSpeakDescription") },
      scanQr: { title: text("stepScanQrTitle"), description: text("stepScanQrDescription") },
      visibleGrowth: { title: text("stepVisibleGrowthTitle"), description: text("stepVisibleGrowthDescription") },
      moreImpact: { title: text("stepMoreImpactTitle"), description: text("stepMoreImpactDescription") }
    }
  };

  const heroHeadline = resolveHeroHeadlineLines(overrides, text);
  const heroHeadlineLines = [
    splitHeadlinePhrase(heroHeadline.line1),
    splitHeadlinePhrase(heroHeadline.line2)
  ].flatMap((part) => [part.lead, part.rest].filter(Boolean));

  return (
    <PublicSiteChrome locale={locale}>
      {/* Hero */}
      <section className="gt-hero" aria-labelledby="gt-hero-title">
        <div className="gt-container gt-hero-inner">
          <div className="gt-hero-copy">
            <h1 id="gt-hero-title" className="gt-hero-headline">
              {heroHeadlineLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h1>
            <p className="gt-hero-subcopy">{text("heroDetail")}</p>
            <div className="gt-hero-actions">
              <Button href="/book-demo" variant="primary" size="hero">
                {nav("bookDemo")}
              </Button>
              <Button href="#how-it-works" variant="text-link">
                {text("seeHow")}
              </Button>
            </div>
          </div>
          <Reveal className="gt-hero-visual-slot" delay={0.08} distance={12}>
            <SimpleDashboardMockup locale={locale} />
          </Reveal>
        </div>
      </section>

      <SocialProofStrip locale={locale} />

      {/* How it works */}
      <HowItWorksDeckSection content={howItWorksContent} />

      {/* Card deck preview */}
      <Reveal delay={0.04} distance={12}>
        <CardDeckPreview locale={locale} overrides={overrides} />
      </Reveal>

      {/* Audiences */}
      <section className="gt-section gt-section-default" id="for-companies" aria-labelledby="gt-audiences-title">
        <div className="gt-container">
          <h2 id="gt-audiences-title" className="gt-visually-hidden">{text("companiesTitle")}</h2>
          <div className="gt-audience-grid">
            {audiences.map(([label, title, copy], index) => (
              <Reveal key={label} delay={index * 0.06} distance={12}>
                <AudienceCard title={title} description={copy} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Photo + value statement */}
      <section className="gt-section gt-section-subtle gt-value-split" aria-labelledby="gt-value-title">
        <div className="gt-container gt-value-split-inner">
          <Reveal distance={12}>
            <div className="gt-value-split-copy">
              <h2 id="gt-value-title">{text("valuePropHeadline")}</h2>
              <p>{text("valuePropParagraph")}</p>
              <Link className="gt-text-link" href="/pricing">
                {text("viewPricing")}
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.08} distance={12}>
            <div className="gt-value-split-photo">
              <Image
                src={RECOGNITION_MOMENT_SRC}
                alt={RECOGNITION_MOMENT_ALT}
                fill
                sizes="(max-width: 920px) calc(100vw - 40px), 520px"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </PublicSiteChrome>
  );
}
