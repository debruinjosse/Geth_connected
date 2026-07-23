import {
  ArrowRight,
  BarChart3,
  Building2,
  CirclePlay,
  Gift,
  HeartHandshake,
  QrCode,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UsersRound
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { GoldenLeaves } from "@/components/GoldenLeaves";
import { HeroDashboardMockup } from "@/components/HeroDashboardMockup";
import { MobileHeroProductPreview } from "@/components/MobileHeroProductPreview";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";
import { Reveal } from "@/components/Reveal";
import { CardDeckPreview } from "@/components/sections/card-deck-preview";

type LandingPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LandingPage({ params }: LandingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });
  const nav = await getTranslations({ locale, namespace: "nav" });

  const howSteps = [
    ["01", t("step1Title"), t("step1Copy"), Gift],
    ["02", t("step2Title"), t("step2Copy"), QrCode],
    ["03", t("step3Title"), t("step3Copy"), UserCheck],
    ["04", t("step4Title"), t("step4Copy"), BarChart3]
  ];

  const audiences = [
    [t("companiesLabel"), t("companiesTitle"), t("companiesCopy"), Building2],
    [t("managersLabel"), t("managersTitle"), t("managersCopy"), UsersRound],
    [t("employeesLabel"), t("employeesTitle"), t("employeesCopy"), HeartHandshake]
  ];
  const bookDemoHref = "/book-demo";

  return (
    <PublicSiteChrome locale={locale}>
      <section className="hero landingHero">
        <GoldenLeaves className="golden-leaves" style={{ left: "-20px", bottom: "40px" }} />
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
            <HeroDashboardMockup />
          </div>
        </div>
        <a className="scrollToExplore" href="#how-it-works">
          <span>{t("scrollExplore")}</span>
          <ArrowRight size={16} />
        </a>
        <Reveal className="mobileHeroPreview" delay={0.04} distance={24}>
          <MobileHeroProductPreview />
        </Reveal>
      </section>

      <section className="section-shell section-shell-compact" id="how-it-works">
        <div className="pageContainer">
          <div className="section-head landingSectionHead">
            <div className="eyebrow">{t("howEyebrow")}</div>
            <h2 className="section-title">{t("howTitle")}</h2>
            <p className="section-copy">{t("howCopy")}</p>
          </div>
          <div className="how-grid processGrid">
            {howSteps.map(([number, title, text, Icon], index) => (
              <Reveal className="how-step processCard" key={title as string} delay={index * 0.08}>
                <div className="processCardTop">
                  <span className="how-number">{number as string}</span>
                  <Icon size={23} strokeWidth={1.8} />
                </div>
                <h3>{title as string}</h3>
                <p>{text as string}</p>
              </Reveal>
            ))}
          </div>

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
                <GoldenLeaves className="golden-leaves" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell cta-band landingCta">
        <GoldenLeaves className="landingCtaLeaf landingCtaLeafLeft" />
        <GoldenLeaves className="landingCtaLeaf landingCtaLeafRight" mirrored />
        <div className="pageContainer landingCtaInner">
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
      </section>
    </PublicSiteChrome>
  );
}
