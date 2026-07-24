import Image from "next/image";
import { BarChart3, CreditCard, House, Settings, Sparkles, TrendingUp, UsersRound } from "lucide-react";
import type { CSSProperties } from "react";
import { CountUp } from "@/components/CountUp";

const heroSidebarLinks = [
  { label: "Home", icon: House },
  { label: "Cards", icon: CreditCard },
  { label: "Team", icon: UsersRound },
  { label: "Signals", icon: Sparkles },
  { label: "Insights", icon: BarChart3 }
] as const;

const heroQualities = [
  { label: "Empathy", value: 82, color: "var(--theme-emerald)" },
  { label: "Proactive", value: 68, color: "var(--theme-gold-deep)" },
  { label: "Collaboration", value: 74, color: "var(--theme-sky)" },
  { label: "Care", value: 61, color: "#92b984" }
] as const;

const kpis = [
  { value: 78, suffix: "%", label: "Energy", tone: "var(--theme-emerald)" },
  { value: 24, suffix: "", label: "Cards shared", tone: "var(--theme-ink)" },
  { value: 11, suffix: "", label: "Qualities recognized", tone: "var(--theme-gold-deep)" }
] as const;

const chartPoints = [
  { cx: 18, cy: 112 },
  { cx: 82, cy: 78 },
  { cx: 146, cy: 56 },
  { cx: 208, cy: 24 }
] as const;

function HeroPhysicalCard() {
  return (
    <div className="hero-physical-card-wrap" aria-hidden="true">
      <div className="hero-physical-card">
        <div className="hero-physical-card-brand">
          <Image alt="" src="/assets/geth-crest-mark.png" width={58} height={54} />
          <span>GETH</span>
        </div>

        <div className="hero-physical-card-message">
          <small>RECOGNIZE TO</small>
          <strong>ENERGIZE.</strong>
        </div>

        <div className="hero-physical-card-number">01</div>

        <div className="hero-card-leaves hero-card-leaves-top">
          <i />
          <i />
          <i />
          <i />
        </div>

        <div className="hero-card-leaves hero-card-leaves-bottom">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}

export function HeroDashboardMockup() {
  return (
    <div className="hero-visual hero-visual-stable">
      <div className="hero-device-stage">
        <HeroPhysicalCard />

        <div className="hero-laptop">
          <div className="hero-laptop-shell">
            <div className="hero-laptop-camera" />

            <div className="hero-laptop-screen">
              <div className="hero-screen-shell">
                <aside className="hero-screen-sidebar">
                  <div className="hero-app-brand">
                    <div className="hero-app-mark">
                      <Image alt="GETH mark" src="/assets/geth-crest-mark.png" width={28} height={26} priority />
                    </div>
                    <span className="hero-app-name">GETH</span>
                  </div>
                  <nav>
                    {heroSidebarLinks.map(({ label, icon: Icon }) => (
                      <span key={label}>
                        <Icon size={14} />
                        {label}
                      </span>
                    ))}
                  </nav>
                  <div className="hero-sidebar-foot">
                    <Settings size={14} />
                    Settings
                  </div>
                </aside>

                <section className="hero-screen-main">
                  <div className="hero-screen-header">
                    <div>
                      <strong>Good morning, Sarah</strong>
                      <p>Team recognition is trending upward this quarter.</p>
                    </div>
                    <span className="quality-pill">This quarter</span>
                  </div>

                  <div className="hero-kpis">
                    {kpis.map((kpi, index) => (
                      <article className="hero-kpi" key={kpi.label} style={{ "--kpi-delay": `${0.5 + index * 0.14}s` } as CSSProperties}>
                        <strong style={{ color: kpi.tone }}>
                          <CountUp value={kpi.value} suffix={kpi.suffix} delay={460 + index * 140} />
                        </strong>
                        <span>{kpi.label}</span>
                        <i className="hero-kpi-indicator" />
                      </article>
                    ))}
                  </div>

                  <div className="hero-data-grid">
                    <article className="hero-data-card hero-quality-card">
                      <div className="hero-panel-head">
                        <strong>Top qualities</strong>
                      </div>
                      <div className="hero-quality-list">
                        {heroQualities.map((quality, index) => (
                          <div className="hero-quality-row" key={quality.label}>
                            <div className="hero-quality-meta">
                              <i style={{ background: quality.color }} />
                              <span>{quality.label}</span>
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
                        <strong>Recognition trend</strong>
                      </div>
                      <div className="hero-chart-shell">
                        <svg aria-hidden="true" className="hero-chart" viewBox="0 0 230 128">
                          <path className="hero-chart-axis" d="M18 112H210" />
                          <path className="hero-chart-trend" d="M18 112C42 108 62 94 82 78C103 61 125 66 146 56C167 47 187 32 208 24" />
                          {chartPoints.map((point) => (
                            <circle key={`${point.cx}-${point.cy}`} cx={point.cx} cy={point.cy} r="4" className="hero-chart-point" />
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
                      <span>Recognition is up 23% this quarter</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>

          <div className="hero-laptop-base">
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}
