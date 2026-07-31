import Image from "next/image";
import { getHeroPhysicalCardAlt, getHeroPhysicalCardSrc, getHeroPreviewCopy } from "@/lib/hero-card-copy";

const kpis = ["78%", "24", "11"] as const;

const qualities = [82, 74, 68] as const;

/**
 * Phone-only landing hero — stacked card + compact dashboard card.
 * No tablet frame, no absolute overlaps (iPhone SE / narrow phones).
 */
export function MobileHeroProductPreview({ locale = "en" }: { locale?: string }) {
  const copy = getHeroPreviewCopy(locale);

  return (
    <section className="mobile-hero-phone-only" aria-label="GETH dashboard preview">
      <div className="mobile-hero-phone-only__card-wrap">
        <div className="mobile-hero-phone-only__card">
          <Image
            alt={getHeroPhysicalCardAlt(locale)}
            src={getHeroPhysicalCardSrc(locale)}
            width={560}
            height={797}
            sizes="112px"
          />
        </div>
      </div>

      <article className="mobile-hero-phone-only__panel">
        <header className="mobile-hero-phone-only__panel-head">
          <strong>{copy.greeting}</strong>
          <span>{copy.mobileDashboard}</span>
        </header>

        <div className="mobile-hero-phone-only__kpis">
          {kpis.map((value, index) => (
            <div className="mobile-hero-phone-only__kpi" key={copy.mobileKpis[index]}>
              <strong>{value}</strong>
              <span>{copy.mobileKpis[index]}</span>
            </div>
          ))}
        </div>

        <div className="mobile-hero-phone-only__qualities">
          <div className="mobile-hero-phone-only__qualities-head">
            <strong>{copy.qualitiesTitle}</strong>
            <span>{copy.mobileMonth}</span>
          </div>
          {qualities.map((value, index) => (
            <div className="mobile-hero-phone-only__quality" key={copy.mobileQualities[index]}>
              <span>{copy.mobileQualities[index]}</span>
              <div className="mobile-hero-phone-only__quality-track">
                <i style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>

        <p className="mobile-hero-phone-only__insight">{copy.mobileInsight}</p>
      </article>
    </section>
  );
}
