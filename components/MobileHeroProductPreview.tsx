import Image from "next/image";

const kpis = [
  { value: "78%", label: "Energy" },
  { value: "24", label: "Cards" },
  { value: "11", label: "Qualities" }
] as const;

const qualities = [
  { label: "Empathy", value: 82 },
  { label: "Collaboration", value: 74 },
  { label: "Creativity", value: 68 }
] as const;

export function MobileHeroProductPreview() {
  return (
    <section className="mobile-hero-device-preview" aria-label="GETH dashboard preview">
      <div className="mobile-hero-physical-card" aria-hidden="true">
        <Image
          alt=""
          src="/assets/geth-card-flyer-cover.png"
          width={560}
          height={797}
          sizes="92px"
          priority
        />
      </div>

      <div className="mobile-hero-tablet-frame">
        <div className="mobile-hero-tablet-shell">
          <div className="mobile-hero-tablet-camera" aria-hidden="true" />
          <div className="mobile-hero-tablet-screen">
            <div className="mobile-hero-product-preview">
              <div className="mobile-preview-header">
                <div>
                  <strong>Good morning, Sarah</strong>
                  <span>Recognition dashboard</span>
                </div>
                <i aria-hidden="true" />
              </div>

              <div className="mobile-preview-kpis">
                {kpis.map((kpi) => (
                  <div className="mobile-preview-kpi" key={kpi.label}>
                    <strong>{kpi.value}</strong>
                    <span>{kpi.label}</span>
                  </div>
                ))}
              </div>

              <div className="mobile-preview-grid">
                <article className="mobile-preview-panel">
                  <div className="mobile-preview-panel-head">
                    <strong>Top qualities</strong>
                    <span>This month</span>
                  </div>
                  <div className="mobile-preview-quality-list">
                    {qualities.map((quality) => (
                      <div className="mobile-preview-quality" key={quality.label}>
                        <span>{quality.label}</span>
                        <div>
                          <i style={{ width: `${quality.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="mobile-preview-panel mobile-preview-trend">
                  <div className="mobile-preview-panel-head">
                    <strong>Trend</strong>
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
                Recognition is up 23%
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
