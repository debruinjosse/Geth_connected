"use client";

import Image from "next/image";
import { BarChart3, CreditCard, House, Settings, Sparkles, TrendingUp, UsersRound } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

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
  { value: "78%", label: "Energy", tone: "var(--theme-emerald)" },
  { value: "24", label: "Cards shared", tone: "var(--theme-ink)" },
  { value: "11", label: "Qualities recognized", tone: "var(--theme-gold-deep)" }
] as const;

const chartPath = "M18 112C42 108 62 94 82 78C103 61 125 66 146 56C167 47 187 32 208 24";

const ease = [0.22, 1, 0.36, 1] as const;

export function HeroDashboardMockup() {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [16, -16]);

  return (
    <motion.div
      ref={ref}
      className="hero-visual"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, delay: 0.28, ease }}
      style={{ y }}
    >
      <div className="hero-device-stage">
        <motion.div
          className="hero-laptop"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 36, rotateX: 8, scale: 0.97 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.9, delay: 0.34, ease }}
          style={{ transformOrigin: "center bottom" }}
        >
          <motion.div
            className="hero-laptop-shell"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
            whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.72, delay: 0.24, ease }}
          >
            <motion.div
              className="hero-laptop-camera"
              initial={prefersReducedMotion ? false : { opacity: 0, scaleX: 0.4 }}
              whileInView={prefersReducedMotion ? undefined : { opacity: 1, scaleX: 1 }}
              viewport={{ once: true, amount: 0.55 }}
              transition={{ duration: 0.4, delay: 0.56, ease }}
            />

            <motion.div
              className="hero-laptop-screen"
              initial={prefersReducedMotion ? false : { opacity: 0.85 }}
              whileInView={prefersReducedMotion ? undefined : { opacity: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.55, delay: 0.46, ease }}
            >
              <div className="hero-screen-shell">
                <aside className="hero-screen-sidebar">
                  <div className="hero-app-brand">
                    <div className="hero-app-mark">
                      <Image alt="GETH mark" src="/assets/geth-crest-mark.png" width={28} height={26} priority />
                    </div>
                    <span className="hero-app-name">GETH</span>
                  </div>
                  <nav>
                    {heroSidebarLinks.map(({ label, icon: Icon }, index) => (
                      <motion.span
                        key={label}
                        initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
                        whileInView={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.35 }}
                        transition={{ duration: 0.4, delay: 0.42 + index * 0.05, ease }}
                      >
                        <Icon size={14} />
                        {label}
                      </motion.span>
                    ))}
                  </nav>
                  <div className="hero-sidebar-foot">
                    <Settings size={14} />
                    Settings
                  </div>
                </aside>

                <section className="hero-screen-main">
                  <motion.div
                    className="hero-screen-header"
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                    whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.45 }}
                    transition={{ duration: 0.5, delay: 0.42, ease }}
                  >
                    <div>
                      <strong>Good morning, Sarah</strong>
                      <p>Team recognition is trending upward this quarter.</p>
                    </div>
                    <span className="quality-pill">This quarter</span>
                  </motion.div>

                  <div className="hero-kpis">
                    {kpis.map((kpi, index) => (
                      <motion.article
                        className="hero-kpi"
                        key={kpi.label}
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
                        whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.46, delay: 0.5 + index * 0.08, ease }}
                      >
                        <motion.strong
                          style={{ color: kpi.tone }}
                          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92 }}
                          whileInView={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
                          viewport={{ once: true, amount: 0.65 }}
                          transition={{ duration: 0.4, delay: 0.6 + index * 0.08, ease }}
                        >
                          {kpi.value}
                        </motion.strong>
                        <span>{kpi.label}</span>
                        <i className="hero-kpi-indicator" />
                      </motion.article>
                    ))}
                  </div>

                  <div className="hero-data-grid">
                    <motion.article
                      className="hero-data-card hero-quality-card"
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
                      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.35 }}
                      transition={{ duration: 0.55, delay: 0.72, ease }}
                    >
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
                              <motion.span
                                style={{ background: quality.color, transformOrigin: "left center" }}
                                initial={prefersReducedMotion ? false : { scaleX: 0 }}
                                whileInView={prefersReducedMotion ? undefined : { scaleX: quality.value / 100 }}
                                viewport={{ once: true, amount: 0.75 }}
                                transition={{ duration: 0.65, delay: 0.9 + index * 0.08, ease }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.article>

                    <motion.article
                      className="hero-data-card hero-trend-card"
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
                      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.35 }}
                      transition={{ duration: 0.55, delay: 0.8, ease }}
                    >
                      <div className="hero-panel-head">
                        <strong>Recognition trend</strong>
                      </div>
                      <div className="hero-chart-shell">
                        <svg aria-hidden="true" className="hero-chart" viewBox="0 0 230 128">
                          <motion.path
                            className="hero-chart-axis"
                            d="M18 112H210"
                            initial={prefersReducedMotion ? false : { pathLength: 0 }}
                            whileInView={prefersReducedMotion ? undefined : { pathLength: 1 }}
                            viewport={{ once: true, amount: 0.8 }}
                            transition={{ duration: 0.55, delay: 0.92, ease }}
                          />
                          <motion.path
                            className="hero-chart-trend"
                            d={chartPath}
                            initial={prefersReducedMotion ? false : { pathLength: 0 }}
                            whileInView={prefersReducedMotion ? undefined : { pathLength: 1 }}
                            viewport={{ once: true, amount: 0.8 }}
                            transition={{ duration: 0.95, delay: 0.98, ease }}
                          />
                          {[
                            { cx: 18, cy: 112 },
                            { cx: 82, cy: 78 },
                            { cx: 146, cy: 56 },
                            { cx: 208, cy: 24 }
                          ].map((point, index) => (
                            <motion.circle
                              key={`${point.cx}-${point.cy}`}
                              cx={point.cx}
                              cy={point.cy}
                              r="4"
                              className="hero-chart-point"
                              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.6 }}
                              whileInView={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
                              viewport={{ once: true, amount: 0.8 }}
                              transition={{ duration: 0.35, delay: 1.18 + index * 0.08, ease }}
                            />
                          ))}
                        </svg>
                        <div className="hero-chart-labels">
                          <span>Jul</span>
                          <span>Aug</span>
                          <span>Sep</span>
                        </div>
                      </div>
                    </motion.article>
                  </div>

                  <motion.div
                    className="hero-screen-footer"
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                    whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.7 }}
                    transition={{ duration: 0.5, delay: 1.22, ease }}
                  >
                    <div className="hero-impact-pill">
                      <TrendingUp size={14} />
                      <span>Recognition is up 23% this quarter</span>
                    </div>
                  </motion.div>
                </section>
              </div>
            </motion.div>
          </motion.div>

          <div className="hero-laptop-base">
            <span />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
