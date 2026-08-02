import {
  ArrowRight,
  BarChart3,
  Building2,
  CirclePlay,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  UsersRound
} from "lucide-react";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HeroDashboardMockup } from "@/components/HeroDashboardMockup";
import { MobileHeroProductPreview } from "@/components/MobileHeroProductPreview";
import { InfinityValueStrip } from "@/components/InfinityValueStrip";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";
import { Reveal } from "@/components/Reveal";
import { RECOGNITION_MOMENT_ALT, RECOGNITION_MOMENT_SRC } from "@/lib/brand";
import { buildMarqueeConfig } from "@/lib/marquee-config";
import { getDefaultTestimonialsForLocale, parseTestimonialItems } from "@/lib/home-cms-defaults";
import { getSiteContentOverrides, pickSiteContentText } from "@/lib/site-content";
import { CardDeckPreview } from "@/components/sections/card-deck-preview";
import { HowItWorksDeckSection } from "@/components/sections/HowItWorksDeckSection";
import { LandingTestimonialsSection } from "@/components/sections/LandingTestimonialsSection";

type LandingPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LandingPage({ params }: LandingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });
  const nav = await getTranslations({ locale, namespace: "nav" });
  const overrides = await getSiteContentOverrides("home", locale);
  const settingsOverrides = locale === "en" ? overrides : await getSiteContentOverrides("home", "en");
  const text = (key: string) => pickSiteContentText(overrides, t(key), key);
  const marqueeConfig = buildMarqueeConfig(overrides, settingsOverrides, locale);
  const storedTestimonials = parseTestimonialItems(overrides.testimonialsItems);
  const testimonialItems = storedTestimonials.length
    ? storedTestimonials
    : getDefaultTestimonialsForLocale(locale);

  const audiences = [
    [t("companiesLabel"), t("companiesTitle"), t("companiesCopy"), Building2],
    [t("managersLabel"), t("managersTitle"), t("managersCopy"), UsersRound],
    [t("employeesLabel"), t("employeesTitle"), t("employeesCopy"), HeartHandshake]
  ];
  const bookDemoHref = "/book-demo";

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

  return (
    <PublicSiteChrome locale={locale}>
      <section className="hero landingHero">
        <div className="pageContainer landingHeroInner">
          <div className="hero-copy landingHeroCopy">
            <Reveal delay={0.02}>
              <div className="eyebrow">{text("ctaEyebrow")}</div>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="brand-display">{text("ctaTitle")}</h1>
            </Reveal>
            <Reveal delay={0.18}>
              <p className="hero-detail-copy">{text("heroDetail")}</p>
            </Reveal>
            <Reveal className="hero-actions" delay={0.26} distance={14}>
              <Link className="btn btn-dark" href="/book-demo">
                {nav("bookDemo")} <ArrowRight size={16} />
              </Link>
              <Link className="btn btn-secondary" href="#how-it-works">
                <CirclePlay size={16} /> {text("seeHow")}
              </Link>
            </Reveal>
            <Reveal className="trust-row" delay={0.34} distance={12}>
              <span>
                <ShieldCheck size={18} /> {text("trustSecure")}
              </span>
              <span>
                <BarChart3 size={18} /> {text("trustInsights")}
              </span>
              <span>
                <UsersRound size={18} /> {text("trustTeams")}
              </span>
            </Reveal>
          </div>

          <div className="desktopHeroPreview">
            <HeroDashboardMockup locale={locale} />
          </div>
          <Reveal className="mobileHeroPreview landingHeroMobileVisual" delay={0.04} distance={24}>
            <MobileHeroProductPreview locale={locale} />
          </Reveal>
        </div>
        <a className="scrollToExplore landingHeroScrollCue" href="#how-it-works">
          <span>{text("scrollExplore")}</span>
          <ArrowRight size={16} />
        </a>
      </section>

      <InfinityValueStrip
        items={marqueeConfig.items}
        className="infinity-strip-below-hero"
        enabled={marqueeConfig.enabled}
        scrollSpeed={marqueeConfig.scrollSpeed}
        backgroundColor={marqueeConfig.backgroundColor}
        textColor={marqueeConfig.textColor}
        dividerStyle={marqueeConfig.dividerStyle}
      />

      <HowItWorksDeckSection content={howItWorksContent} />

      <section className="section-shell section-shell-compact howPosterSection">
        <div className="pageContainer">
          <Reveal delay={0.12} distance={18}>
            <CardDeckPreview locale={locale} overrides={overrides} />
          </Reveal>
        </div>
      </section>

      <section className="section-shell section-shell-follow" id="for-companies">
        <div className="pageContainer">
          <div className="audience-grid audienceGrid">
            {audiences.map(([label, title, copy, Icon], index) => (
              <Reveal className="audience-card audienceCard" key={label as string} delay={index * 0.08}>
                <Icon className="audienceCardIcon" size={34} strokeWidth={1.6} />
                <div className="eyebrow">{label as string}</div>
                <h3>{title as string}</h3>
                <p>{copy as string}</p>
                <Link href={bookDemoHref} className="audience-demo-cta">
                  {nav("bookDemo")} <ArrowRight size={14} />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell cta-band landingCta pre-footer-recognition" id="value-proposition">
        <div className="pageContainer landingCtaInner">
          <div className="landingCtaContent">
            <Reveal className="cta-copy" distance={18}>
              <div className="eyebrow">{t("valuePropEyebrow")}</div>
              <h2 className="section-title">{t("valuePropHeadline")}</h2>
              <p className="hero-detail-copy landingCtaDetail">{t("valuePropParagraph")}</p>
            </Reveal>
            <Reveal className="hero-actions landingCtaActions" delay={0.1} distance={14}>
              <Link className="btn btn-primary" href="/book-demo">
                {nav("bookDemo")} <Sparkles size={16} />
              </Link>
              <Link className="btn btn-secondary" href="/pricing">
                {t("viewPricing")}
              </Link>
            </Reveal>
          </div>
          <Reveal className="landingCtaMedia landingRecognitionPhoto" delay={0.16} distance={16}>
            <Image
              src={RECOGNITION_MOMENT_SRC}
              alt={RECOGNITION_MOMENT_ALT}
              fill
              sizes="(max-width: 920px) calc(100vw - 40px), 520px"
              className="landingRecognitionPhotoImg"
              priority={false}
            />
          </Reveal>
        </div>
      </section>

      <LandingTestimonialsSection
        eyebrow={text("testimonialsEyebrow")}
        title={text("testimonialsTitle")}
        copy={text("testimonialsCopy")}
        items={testimonialItems}
      />
    </PublicSiteChrome>
  );
}
