import Image from "next/image";
import { getHeroPhysicalCardAlt, getHeroPhysicalCardSrc, getHeroPreviewCopy } from "@/lib/hero-card-copy";

const kpis = ["78%", "24", "11"] as const;

const qualities = [82, 74, 68] as const;

export function MobileHeroProductPreview({ locale = "en" }: { locale?: string }) {
  const copy = getHeroPreviewCopy(locale);

  return (
    <section className="mobile-hero-simple" aria-label="GETH dashboard preview">
      <div className="mobile-hero-simple__layout">
        <div className="mobile-hero-simple__card" aria-hidden="true">
          <Image
            alt={getHeroPhysicalCardAlt(locale)}
            src={getHeroPhysicalCardSrc(locale)}
            width={560}
            height={797}
            sizes="96px"
          />
        </div>

        <div className="mobile-hero-simple__phone">
          <div className="mobile-hero-simple__notch" aria-hidden="true" />
          <div className="mobile-hero-simple__screen">
            <div className="mobile-hero-simple__header">
              <strong>{copy.greeting}</strong>
              <span>{copy.mobileDashboard}</span>
            </div>

            <div className="mobile-hero-simple__kpis">
              {kpis.map((value, index) => (
                <div className="mobile-hero-simple__kpi" key={copy.mobileKpis[index]}>
                  <strong>{value}</strong>
                  <span>{copy.mobileKpis[index]}</span>
                </div>
              ))}
            </div>

            <div className="mobile-hero-simple__qualities">
              <div className="mobile-hero-simple__qualities-head">
                <strong>{copy.qualitiesTitle}</strong>
                <span>{copy.mobileMonth}</span>
              </div>
              {qualities.map((value, index) => (
                <div className="mobile-hero-simple__quality" key={copy.mobileQualities[index]}>
                  <span>{copy.mobileQualities[index]}</span>
                  <div className="mobile-hero-simple__quality-track">
                    <i style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <p className="mobile-hero-simple__insight">{copy.mobileInsight}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
