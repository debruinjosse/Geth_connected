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
import { PublicSiteChrome } from "@/components/PublicSiteChrome";
import { Reveal } from "@/components/Reveal";
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

  const audiences = [
    [t("companiesLabel"), t("companiesTitle"), t("companiesCopy"), Building2],
    [t("managersLabel"), t("managersTitle"), t("managersCopy"), UsersRound],
    [t("employeesLabel"), t("employeesTitle"), t("employeesCopy"), HeartHandshake]
  ];
  const bookDemoHref = "/book-demo";

  return (
    <PublicSiteChrome locale={locale}>
      <section className="hero landingHero">
        <div className="pageContainer landingHeroInner">
          <div className="hero-copy landingHeroCopy">
            <Reveal delay={0.02}>
              <div className="eyebrow">{t("eyebrow")}</div>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="brand-display">
                {t("headlineLine1")}
                <br />
                {t("headlineLine2")}
              </h1>
            </Reveal>
            <Reveal delay={0.18}>
              <p>{t("description")}</p>
            </Reveal>
            <Reveal className="hero-actions" delay={0.26} distance={14}>
              <Link className="btn btn-dark" href="/book-demo">
                {nav("bookDemo")} <ArrowRight size={16} />
              </Link>
              <Link className="btn btn-secondary" href="#how-it-works">
                <CirclePlay size={16} /> {t("seeHow")}
              </Link>
            </Reveal>
            <Reveal className="trust-row" delay={0.34} distance={12}>
              <span>
                <ShieldCheck size={18} /> {t("trustSecure")}
              </span>
              <span>
                <BarChart3 size={18} /> {t("trustInsights")}
              </span>
              <span>
                <UsersRound size={18} /> {t("trustTeams")}
              </span>
            </Reveal>
          </div>

          <div className="desktopHeroPreview">
            <HeroDashboardMockup locale={locale} />
          </div>
        </div>
        <a className="scrollToExplore" href="#how-it-works">
          <span>{t("scrollExplore")}</span>
          <ArrowRight size={16} />
        </a>
        <Reveal className="mobileHeroPreview" delay={0.04} distance={24}>
          <MobileHeroProductPreview locale={locale} />
        </Reveal>
      </section>

      <HowItWorksDeckSection />

      <section className="section-shell section-shell-compact howPosterSection">
        <div className="pageContainer">
          <Reveal delay={0.12} distance={18}>
            <CardDeckPreview locale={locale} />
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

      <section className="section-shell cta-band landingCta">
        <div className="pageContainer landingCtaInner">
          <div className="landingCtaContent">
            <Reveal className="cta-copy" distance={18}>
              <div className="eyebrow">{t("ctaEyebrow")}</div>
              <h2 className="section-title">{t("ctaTitle")}</h2>
            </Reveal>
            <Reveal className="hero-actions landingCtaActions" delay={0.1} distance={14}>
              <Link className="btn btn-primary" href="/book-demo">
                {nav("bookDemo")} <Sparkles size={16} />
              </Link>
              <Link className="btn btn-dark" href="/signup?role=company_admin">
                {t("registerCompany")} <ArrowRight size={16} />
              </Link>
              <Link className="btn btn-secondary" href="/pricing">
                {t("viewPricing")}
              </Link>
            </Reveal>
          </div>
          <Reveal className="landingCtaMedia" delay={0.16} distance={16}>
            <Image
              src="/assets/geth-recognition-moment.png"
              alt="A team celebrating a GETH recognition moment"
              fill
              sizes="(max-width: 920px) calc(100vw - 40px), 480px"
              priority={false}
            />
          </Reveal>
        </div>
      </section>
    </PublicSiteChrome>
  );
}
