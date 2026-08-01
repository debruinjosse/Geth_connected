import Image from "next/image";
import { BrandMarkIcon } from "@/components/BrandLogo";
import { BrandWordmark } from "@/components/BrandWordmark";
import { BarChart3, CreditCard, House, Settings, Sparkles, TrendingUp, UsersRound } from "lucide-react";
import type { CSSProperties } from "react";
import { CountUp } from "@/components/CountUp";
import { getHeroPhysicalCardAlt, getHeroPhysicalCardSrc, getHeroPreviewCopy } from "@/lib/hero-card-copy";

const heroSidebarIcons = [
  House,
  CreditCard,
  UsersRound,
  Sparkles,
  BarChart3
] as const;

const heroQualities = [
  { value: 82, color: "var(--theme-emerald)" },
  { value: 68, color: "var(--theme-gold-deep)" },
  { value: 74, color: "var(--theme-sky)" },
  { value: 61, color: "#92b984" }
] as const;

const kpis = [
  { value: 78, suffix: "%", tone: "var(--theme-emerald)" },
  { value: 24, suffix: "", tone: "var(--theme-ink)" },
  { value: 11, suffix: "", tone: "var(--theme-gold-deep)" }
] as const;

const chartPoints = [
  { cx: 18, cy: 112 },
  { cx: 82, cy: 78 },
  { cx: 146, cy: 56 },
  { cx: 208, cy: 24 }
] as const;

function HeroPhysicalCard({ locale }: { locale: string }) {
  return (
    <div className="hero-physical-card-wrap" aria-hidden="true">
      <div className="hero-physical-card">
        <Image
          alt={getHeroPhysicalCardAlt(locale)}
          src={getHeroPhysicalCardSrc(locale)}
          width={560}
          height={797}
          sizes="(max-width: 767px) 88px, 176px"
        />
      </div>
    </div>
  );
}

export function HeroDashboardMockup({ locale = "en" }: { locale?: string }) {
  const copy = getHeroPreviewCopy(locale);

  return (
    <div className="hero-visual hero-visual-stable">
      <div className="hero-device-stage">
        <HeroPhysicalCard locale={locale} />

        <div className="hero-laptop">
          <div className="hero-laptop-shell">
            <div className="hero-laptop-camera" />

            <div className="hero-laptop-screen">
              <div className="hero-screen-shell">
                <aside className="hero-screen-sidebar">
                  <div className="hero-app-brand">
                    <div className="hero-app-mark">
                      <BrandMarkIcon size={28} />
                    </div>
                    <span className="hero-app-name"><BrandWordmark /></span>
                  </div>
                  <nav className="hero-sidebar-nav" aria-label="Dashboard preview navigation">
                    {copy.sidebar.map((label, index) => {
                      const Icon = heroSidebarIcons[index] ?? House;
                      const isActive = index === 0;

                      return (
                        <span
                          key={label}
                          className={`hero-nav-tab ${isActive ? "is-active" : ""}`.trim()}
                          style={{ "--nav-delay": `${0.48 + index * 0.07}s` } as CSSProperties}
                        >
                          <Icon size={14} />
                          <span className="hero-nav-tab-label">{label}</span>
                        </span>
                      );
                    })}
                  </nav>
                  <div className="hero-sidebar-foot">
                    <Settings size={14} />
                    {copy.settings}
                  </div>
                </aside>

                <section className="hero-screen-main">
                  <div className="hero-screen-header">
                    <div>
                      <strong>{copy.greeting}</strong>
                      <p>{copy.description}</p>
                    </div>
                    <span className="quality-pill">{copy.period}</span>
                  </div>

                  <div className="hero-kpis">
                    {kpis.map((kpi, index) => (
                      <article className="hero-kpi" key={copy.kpis[index]} style={{ "--kpi-delay": `${0.5 + index * 0.14}s` } as CSSProperties}>
                        <strong style={{ color: kpi.tone }}>
                          <CountUp value={kpi.value} suffix={kpi.suffix} delay={460 + index * 140} />
                        </strong>
                        <span>{copy.kpis[index]}</span>
                        <i className="hero-kpi-indicator" />
                      </article>
                    ))}
                  </div>

                  <div className="hero-data-grid">
                    <article className="hero-data-card hero-quality-card">
                      <div className="hero-panel-head">
                        <strong>{copy.qualitiesTitle}</strong>
                      </div>
                      <div className="hero-quality-list">
                        {heroQualities.map((quality, index) => (
                          <div className="hero-quality-row" key={copy.qualities[index]}>
                            <div className="hero-quality-meta">
                              <i style={{ background: quality.color }} />
                              <span>{copy.qualities[index]}</span>
                            </div>
                            <div className="hero-quality-bar">
                              <span
                                style={
                                  {
                                    "--bar-scale": quality.value / 100,
                                    "--bar-delay": `${0.82 + index * 0.12}s`,
                                    background: quality.color
                                  } as CSSProperties
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>

                    <article className="hero-data-card hero-trend-card">
                      <div className="hero-panel-head">
                        <strong>{copy.trendTitle}</strong>
                      </div>
                      <div className="hero-chart-shell">
                        <svg aria-hidden="true" className="hero-chart" viewBox="0 0 230 128">
                          <path className="hero-chart-axis" d="M18 112H210" />
                          <path className="hero-chart-trend" d="M18 112C42 108 62 94 82 78C103 61 125 66 146 56C167 47 187 32 208 24" />
                          {chartPoints.map((point, index) => (
                            <circle
                              key={`${point.cx}-${point.cy}`}
                              cx={point.cx}
                              cy={point.cy}
                              r="4"
                              className="hero-chart-point"
                              style={{ "--point-delay": `${1.35 + index * 0.12}s` } as CSSProperties}
                            />
                          ))}
                        </svg>
                        <div className="hero-chart-labels">
                          <span>Jul</span>
                          <span>Aug</span>
                          <span>Sep</span>
                        </div>
                      </div>
                    </article>
                  </div>

                  <div className="hero-screen-footer">
                    <div className="hero-impact-pill">
                      <TrendingUp size={14} />
                      <span>{copy.insight}</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
