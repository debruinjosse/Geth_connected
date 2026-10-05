import { MockupFrame } from "@/components/ui/MockupFrame";
import { getHeroPhysicalCardAlt, getHeroPhysicalCardSrc, getHeroPreviewCopy } from "@/lib/hero-card-copy";
import Image from "next/image";

const trendPoints = "4,56 36,46 68,50 100,30 132,34 164,14";

/**
 * Calm, simplified hero visual: one clean dashboard panel (3 KPI numbers + a
 * single trend line) with one physical card overlapping its corner — replaces
 * the old animated laptop mockup + 3-card fan.
 */
export function SimpleDashboardMockup({ locale = "en" }: { locale?: string }) {
  const copy = getHeroPreviewCopy(locale);
  const kpiValues = ["78%", "24", "11"];

  return (
    <div className="gt-hero-visual" aria-hidden="true">
      <MockupFrame className="gt-hero-dashboard">
        <div className="gt-hero-dashboard-head">
          <strong>{copy.greeting}</strong>
          <p>{copy.description}</p>
        </div>
        <div className="gt-hero-kpis">
          {kpiValues.map((value, index) => (
            <div className="gt-hero-kpi" key={copy.kpis[index]}>
              <strong>{value}</strong>
              <span>{copy.kpis[index]}</span>
            </div>
          ))}
        </div>
        <div className="gt-hero-trend">
          <span className="gt-hero-trend-title">{copy.trendTitle}</span>
          <svg viewBox="0 0 168 64" className="gt-hero-trend-svg" aria-hidden="true">
            <polyline points={trendPoints} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </MockupFrame>
      <div className="gt-hero-card">
        <Image
          alt={getHeroPhysicalCardAlt(locale)}
          src={getHeroPhysicalCardSrc(locale)}
          width={560}
          height={797}
          sizes="140px"
        />
      </div>
    </div>
  );
}
