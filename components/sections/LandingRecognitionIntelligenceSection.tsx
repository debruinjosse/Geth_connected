import { Reveal } from "@/components/Reveal";

type LandingRecognitionIntelligenceSectionProps = {
  eyebrow: string;
  title: string;
  paragraph: string;
  bullets: string[];
};

export function LandingRecognitionIntelligenceSection({
  eyebrow,
  title,
  paragraph,
  bullets
}: LandingRecognitionIntelligenceSectionProps) {
  const visibleBullets = bullets.filter(Boolean);
  if (!title.trim() && !paragraph.trim() && !visibleBullets.length) return null;

  return (
    <section className="section-shell landing-intelligence" id="recognition-intelligence">
      <div className="pageContainer">
        <Reveal className="landing-intelligence-copy" distance={18}>
          <div className="eyebrow">{eyebrow}</div>
          <h2 className="section-title">{title}</h2>
          <p className="hero-detail-copy">{paragraph}</p>
        </Reveal>
        {visibleBullets.length ? (
          <div className="landing-intelligence-grid">
            {visibleBullets.map((bullet) => (
              <Reveal className="landing-intelligence-card" key={bullet} delay={0.06}>
                <p>{bullet}</p>
              </Reveal>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
