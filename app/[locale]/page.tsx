/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CardRail } from "@/components/landing/CardRail";
import { buildRailCards, railFilters } from "@/lib/landing-cards";
import { Button } from "@/components/ui/Button";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";
import { localizePublicHref } from "@/lib/navigation/public-nav";

type LandingPageProps = {
  params: Promise<{ locale: string }>;
};

const LINK_ARROW = (
  <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

const BADGES = [
  { file: "geth_badge_01_nieuw", key: "b1", locked: false },
  { file: "geth_badge_02_zichtbaar", key: "b2", locked: false },
  { file: "geth_badge_03_erkend", key: "b3", locked: false },
  { file: "geth_badge_04_groeiend", key: "b4", locked: true },
  { file: "geth_badge_05_verbindend", key: "b5", locked: true },
  { file: "geth_badge_06_inspirerend", key: "b6", locked: true }
] as const;

export default async function LandingPage({ params }: LandingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "landingV2" });
  const nav = await getTranslations({ locale, namespace: "nav" });
  const lang = locale === "nl" ? "nl" : "en";
  const otherLang = lang === "nl" ? "en" : "nl";
  const other = await getTranslations({ locale: otherLang, namespace: "landingV2" });
  /**
   * Text that must keep the same line count in NL and EN: the other language is rendered invisibly in the
   * same grid cell, so the block always reserves the taller of the two (no layout shift between languages).
   */
  const bi = (key: string) => (
    <span className="lp-bi">
      <span>{t(key)}</span>
      <span className="lp-ghost" aria-hidden="true">
        {other(key)}
      </span>
    </span>
  );
  const demoHref = localizePublicHref("/book-demo", locale);
  const pricingHref = localizePublicHref("/pricing", locale);

  const railCards = buildRailCards(lang, { com: t("fCom"), cre: t("fCre"), cmp: t("fCmp"), col: t("fCol") });
  const railFilterList = railFilters({ all: t("fAll"), com: t("fCom"), cre: t("fCre"), cmp: t("fCmp"), col: t("fCol") });

  return (
    <PublicSiteChrome locale={locale}>
      <div className="lp">
        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-wrap lp-hero-grid">
            <div className="lp-rv">
              <span className="lp-eyebrow">{t("heroEyebrow")}</span>
              <h1>
                <span>{t("h1a")}</span>
                <br />
                <span className="lp-accent">{t("h1b")}</span>
              </h1>
              <p className="lp-lead">{t("heroLead")}</p>
              <div className="lp-cta-row">
                <Button href={demoHref} arrow>
                  {nav("bookDemo")}
                </Button>
                <Button href="#how-it-works" variant="ghost">
                  {t("seeHow")}
                </Button>
              </div>
              <div className="lp-trust">
                <span>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.500-7-10V6z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  <i style={{ fontStyle: "normal" }}>{t("t1")}</i>
                </span>
                <span>
                  <svg viewBox="0 0 24 24">
                    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
                  </svg>
                  <i style={{ fontStyle: "normal" }}>{t("t2")}</i>
                </span>
                <span>
                  <svg viewBox="0 0 24 24">
                    <circle cx="9" cy="8" r="3" />
                    <circle cx="17" cy="9" r="2.200" />
                    <path d="M3 20c0-3.500 2.700-6 6-6s6 2.500 6 6M15.500 14.500c3 0 5.500 2 5.500 5.500" />
                  </svg>
                  <i style={{ fontStyle: "normal" }}>{t("t3")}</i>
                </span>
              </div>
            </div>

            <div className="lp-stage lp-rv" aria-hidden="true">
              <div className="lp-dash">
                <div className="lp-dash-bar">
                  <i />
                  <i />
                  <i />
                </div>
                <h4>{t("dGreet")}</h4>
                <small>{t("dSub")}</small>
                <div className="lp-kpis">
                  <div className="lp-kpi">
                    <b>78%</b>
                    <span>{bi("k1")}</span>
                  </div>
                  <div className="lp-kpi">
                    <b>24</b>
                    <span>{bi("k2")}</span>
                  </div>
                  <div className="lp-kpi">
                    <b>11</b>
                    <span>{bi("k3")}</span>
                  </div>
                </div>
                <div className="lp-trend">
                  <div className="lp-trend-h">
                    <span>{t("k4")}</span>
                    <em>+23%</em>
                  </div>
                  <svg viewBox="0 0 300 84" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="lp-g" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0" stopColor="#B69F57" stopOpacity=".28" />
                        <stop offset="1" stopColor="#B69F57" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0 70 C40 66 60 58 90 56 S150 44 180 36 S250 18 300 8 V84 H0Z" fill="url(#lp-g)" />
                    <path d="M0 70 C40 66 60 58 90 56 S150 44 180 36 S250 18 300 8" fill="none" stroke="#7A6528" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="300" cy="8" r="4" fill="#7A6528" />
                  </svg>
                </div>
              </div>
              <img className="lp-hero-card" alt="" src={`/landing/cards/${lang}/card_01_cover.png`} />
              <div className="lp-chip">
                <img src="/landing/badges/geth_badge_03_erkend.svg" alt="" />
                <div>
                  <b>{t("chipT")}</b>
                  <small>{t("chipS")}</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VALUES */}
        <div className="lp-strip" aria-label={t("values")}>
          <div className="lp-wrap lp-strip-in">
            <span>{t("v1")}</span>
            <span>{t("v2")}</span>
            <span>{t("v3")}</span>
            <span>{t("v4")}</span>
            <span>{t("v5")}</span>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <section className="lp-section lp-how" id="how-it-works">
          <div className="lp-wrap">
            <div className="lp-sec-head lp-center lp-rv" style={{ textAlign: "center" }}>
              <span className="lp-eyebrow">{t("howEye")}</span>
              <h2>{t("howT")}</h2>
            </div>
            <div className="lp-steps">
              <div className="lp-step lp-rv">
                <div className="lp-ico">
                  <span className="lp-num">1</span>
                  <svg viewBox="0 0 48 48">
                    <rect x="8" y="12" width="22" height="30" rx="3" transform="rotate(-10 19 27)" />
                    <rect x="14" y="8" width="22" height="30" rx="3" className="lp-p" transform="rotate(-3 25 23)" />
                    <rect x="20" y="7" width="22" height="30" rx="3" />
                    <path d="M31 18c-3 0-5 2-5 5 0 3 2 5 5 5s5-2 5-5" />
                    <circle cx="33" cy="20" r="1" />
                  </svg>
                </div>
                <h3>{bi("s1t")}</h3>
                <p>{bi("s1c")}</p>
              </div>
              <div className="lp-step lp-rv">
                <div className="lp-ico">
                  <span className="lp-num">2</span>
                  <svg viewBox="0 0 48 48">
                    <path d="M8 6h32a3 3 0 013 3v11a3 3 0 01-3 3H29l-5 5-5-5H8a3 3 0 01-3-3V9a3 3 0 013-3z" />
                    <path className="lp-p" d="M24 18.500c-4-2.700-5-5-3.500-6.500 1.300-1.200 3-.8 3.500.5.500-1.300 2.200-1.700 3.500-.5 1.500 1.500.5 3.800-3.500 6.500z" />
                    <circle cx="16" cy="34" r="3.500" />
                    <circle cx="32" cy="34" r="3.500" />
                    <path d="M9 44c0-4 3-6 7-6s7 2 7 6M25 44c0-4 3-6 7-6s7 2 7 6" />
                  </svg>
                </div>
                <h3>{bi("s2t")}</h3>
                <p>{bi("s2c")}</p>
              </div>
              <div className="lp-step lp-rv">
                <div className="lp-ico">
                  <span className="lp-num">3</span>
                  <svg viewBox="0 0 48 48">
                    <rect x="13" y="4" width="22" height="40" rx="4" />
                    <path d="M21 8h6M22 40h4" />
                    <rect className="lp-p" x="18" y="14" width="5" height="5" />
                    <rect className="lp-p" x="26" y="14" width="5" height="5" />
                    <rect className="lp-p" x="18" y="23" width="5" height="5" />
                    <path className="lp-p" d="M27 24h4v4h-4zM22 32h4" />
                  </svg>
                </div>
                <h3>{bi("s3t")}</h3>
                <p>{bi("s3c")}</p>
              </div>
              <div className="lp-step lp-rv">
                <div className="lp-ico">
                  <span className="lp-num">4</span>
                  <svg viewBox="0 0 48 48">
                    <circle cx="16" cy="18" r="6" />
                    <path d="M5 40c0-6.500 5-10 11-10s11 3.500 11 10z" />
                    <path className="lp-p" d="M27 20l12-12M30 8h9v9M32 38V30M39 38V24" />
                  </svg>
                </div>
                <h3>{bi("s4t")}</h3>
                <p>{bi("s4c")}</p>
              </div>
              <div className="lp-step lp-rv">
                <div className="lp-ico">
                  <span className="lp-num">5</span>
                  <svg viewBox="0 0 48 48">
                    <path className="lp-p" d="M24 17c-6-4-8-8-5.500-11 2-2.300 4.500-1.500 5.500.8 1-2.300 3.500-3.100 5.500-.8C32 9 30 13 24 17z" />
                    <circle cx="24" cy="26" r="4" />
                    <circle cx="12" cy="29" r="3.500" />
                    <circle cx="36" cy="29" r="3.500" />
                    <path d="M16 44c0-5 3.500-8 8-8s8 3 8 8zM4 43c0-4 3-6.500 6.500-6.500M44 43c0-4-3-6.500-6.500-6.500" />
                  </svg>
                </div>
                <h3>{bi("s5t")}</h3>
                <p>{bi("s5c")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* CARDS */}
        <section className="lp-section lp-cards" id="cards">
          <div className="lp-wrap">
            <CardRail
              header={
                <div className="lp-sec-head">
                  <span className="lp-eyebrow">{t("cEye")}</span>
                  <h2>{t("cT")}</h2>
                  <p>{t("cP")}</p>
                </div>
              }
              cards={railCards}
              filters={railFilterList}
              ariaLabel={t("cardsAria")}
              filterLabel={t("category")}
              hint={t("cHint")}
              prevLabel={t("prev")}
              nextLabel={t("next")}
              closeLabel={t("close")}
            />
          </div>
        </section>

        {/* AUDIENCES */}
        <section className="lp-section" id="for">
          <div className="lp-wrap">
            <div className="lp-sec-head lp-rv">
              <span className="lp-eyebrow">{t("aEye")}</span>
              <h2>{t("aT")}</h2>
            </div>
            <div className="lp-aud">
              <article className="lp-a lp-rv">
                <svg viewBox="0 0 36 36">
                  <rect x="7" y="4" width="16" height="28" rx="1.500" />
                  <path d="M23 14h6v18H7M12 10h6M12 15h6M12 20h6M12 25h6" />
                </svg>
                <span className="lp-eyebrow">{bi("a1l")}</span>
                <h3>{bi("a1t")}</h3>
                <p>{bi("a1c")}</p>
                <Link className="lp-link" href={demoHref}>
                  <span>{nav("bookDemo")}</span>
                  {LINK_ARROW}
                </Link>
              </article>
              <article className="lp-a lp-rv">
                <svg viewBox="0 0 36 36">
                  <circle cx="18" cy="11" r="6" />
                  <path d="M6 32c0-7 5-11 12-11s12 4 12 11" />
                  <path d="M18 21v5M15.500 27.500L18 30l2.500-2.500" />
                </svg>
                <span className="lp-eyebrow">{bi("a2l")}</span>
                <h3>{bi("a2t")}</h3>
                <p>{bi("a2c")}</p>
                <Link className="lp-link" href={demoHref}>
                  <span>{nav("bookDemo")}</span>
                  {LINK_ARROW}
                </Link>
              </article>
              <article className="lp-a lp-rv">
                <svg viewBox="0 0 36 36">
                  <path d="M18 31C6 23 5 14 10 10.500c3.500-2.500 7 0 8 3 1-3 4.500-5.500 8-3C31 14 30 23 18 31z" />
                </svg>
                <span className="lp-eyebrow">{bi("a3l")}</span>
                <h3>{bi("a3t")}</h3>
                <p>{bi("a3c")}</p>
                <Link className="lp-link" href={demoHref}>
                  <span>{nav("bookDemo")}</span>
                  {LINK_ARROW}
                </Link>
              </article>
            </div>
          </div>
        </section>

        {/* GROWTH */}
        <section className="lp-section lp-growth">
          <div className="lp-wrap lp-growth-grid">
            <div className="lp-rv">
              <span className="lp-eyebrow">{t("gEye")}</span>
              <h2 style={{ marginTop: 16 }}>{t("gT")}</h2>
              <p className="lp-lead">{t("gP")}</p>
              <Button href={demoHref} arrow>
                {nav("bookDemo")}
              </Button>
            </div>
            <div className="lp-badges lp-rv">
              {BADGES.map((badge) => (
                <div key={badge.file} className={`lp-badge${badge.locked ? " lp-locked" : ""}`}>
                  <img src={`/landing/badges/${badge.file}.svg`} alt="" />
                  <span>{bi(badge.key)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MOMENT */}
        <section className="lp-section lp-moment" id="moment">
          <div className="lp-wrap lp-moment-grid">
            <div className="lp-rv">
              <span className="lp-eyebrow">{t("mEye")}</span>
              <h2>{t("mT")}</h2>
              <p className="lp-lead">{t("mP")}</p>
              <div className="lp-cta-row">
                <Button href={demoHref}>{nav("bookDemo")}</Button>
                <Button href={pricingHref} variant="ghost">
                  {t("mPrice")}
                </Button>
              </div>
            </div>
            <div className="lp-photo lp-rv">
              <img className="lp-main" src="/assets/geth-recognition-moment.png" alt={t("photoAlt")} loading="lazy" />
              <img className="lp-bird" src="/landing/badges/geth_bird_mark_only.svg" alt="" />
            </div>
          </div>
        </section>
      </div>
    </PublicSiteChrome>
  );
}
