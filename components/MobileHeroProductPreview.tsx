import Image from "next/image";
import { getHeroPreviewCopy } from "@/lib/hero-card-copy";

const kpis = [
  "78%",
  "24",
  "11"
] as const;

const qualities = [
  82,
  74,
  68
] as const;

export function MobileHeroProductPreview({ locale = "en" }: { locale?: string }) {
  const copy = getHeroPreviewCopy(locale);

  return (
    <section className="mobile-hero-device-preview" aria-label="GETH dashboard preview">
      <div className="mobile-hero-physical-card" aria-hidden="true">
        <Image
          alt=""
          src="/assets/geth-card-flyer-cover.png"
          width={560}
          height={797}
          sizes="92px"
        />
      </div>

      <div className="mobile-hero-tablet-frame">
        <div className="mobile-hero-tablet-shell">
          <div className="mobile-hero-tablet-camera" aria-hidden="true" />
          <div className="mobile-hero-tablet-screen">
            <div className="mobile-hero-product-preview">
              <div className="mobile-preview-header">
                <div>
                  <strong>{copy.greeting}</strong>
                  <span>{copy.mobileDashboard}</span>
                </div>
                <i aria-hidden="true" />
              </div>

              <div className="mobile-preview-kpis">
                {kpis.map((value, index) => (
                  <div className="mobile-preview-kpi" key={copy.mobileKpis[index]}>
                    <strong>{value}</strong>
                    <span>{copy.mobileKpis[index]}</span>
                  </div>
                ))}
              </div>

              <div className="mobile-preview-grid">
                <article className="mobile-preview-panel">
                  <div className="mobile-preview-panel-head">
                    <strong>{copy.qualitiesTitle}</strong>
                    <span>{copy.mobileMonth}</span>
                  </div>
                  <div className="mobile-preview-quality-list">
                    {qualities.map((value, index) => (
                      <div className="mobile-preview-quality" key={copy.mobileQualities[index]}>
                        <span>{copy.mobileQualities[index]}</span>
                        <div>
                          <i style={{ width: `${value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="mobile-preview-panel mobile-preview-trend">
                  <div className="mobile-preview-panel-head">
                    <strong>{copy.mobileTrend}</strong>
                    <span>+23%</span>
                  </div>
                  <svg aria-hidden="true" viewBox="0 0 180 72">
                    <path d="M12 58H168" />
                    <path d="M14 54C34 50 44 36 62 38C82 40 86 22 106 24C128 26 136 14 164 12" />
                    <circle cx="62" cy="38" r="4" />
                    <circle cx="106" cy="24" r="4" />
                    <circle cx="164" cy="12" r="4" />
                  </svg>
                </article>
              </div>

              <div className="mobile-preview-insight">
                <span aria-hidden="true">+23</span>
                {copy.mobileInsight}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
