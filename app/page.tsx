import Link from "next/link";
import { ArrowRight, BarChart3, CirclePlay, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { GoldenLeaves } from "@/components/GoldenLeaves";
import { HeroDashboardMockup } from "@/components/HeroDashboardMockup";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";
import { Reveal } from "@/components/Reveal";
import { categoryMeta, getCategoryDisplayName, gethCards, type CardCategory } from "@/lib/cards";

const cardPreviewCategories: CardCategory[] = ["Communicatie", "Creativiteit", "Competentie", "Collegialiteit", "Open kaart"];
const cardPreviews = cardPreviewCategories.flatMap((category) => {
  const card = gethCards.find((item) => item.active && item.category === category);
  return card ? [card] : [];
});

export default function LandingPage() {
  return (
    <PublicSiteChrome>
      <section className="hero">
        <GoldenLeaves className="golden-leaves" style={{ left: "-20px", bottom: "40px" }} />
        <div className="hero-copy">
          <Reveal delay={0.02}>
            <div className="eyebrow">GETH Connected Cards</div>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="brand-display">
              Small moments.
              <br />
              Big impact.
            </h1>
          </Reveal>
          <Reveal delay={0.18}>
            <p>
              Turn everyday recognition into measurable culture insights. Our connected cards help teams feel seen, stay energized, and grow together.
            </p>
          </Reveal>
          <Reveal className="hero-actions" delay={0.26} distance={14}>
            <Link className="btn btn-dark" href="/book-demo">
              Book a demo <ArrowRight size={16} />
            </Link>
            <Link className="btn btn-secondary" href="#how-it-works">
              <CirclePlay size={16} /> See how it works
            </Link>
          </Reveal>
          <Reveal className="trust-row" delay={0.34} distance={12}>
            <span>
              <ShieldCheck size={18} /> Secure & private
            </span>
            <span>
              <BarChart3 size={18} /> Actionable insights
            </span>
            <span>
              <UsersRound size={18} /> Built for teams
            </span>
          </Reveal>
          <Reveal className="hero-card-preview" delay={0.42} distance={12}>
            <div className="hero-card-preview-head">
              <span className="eyebrow">Card deck preview</span>
              <Link href="/cards">View all cards <ArrowRight size={13} /></Link>
            </div>
            <div className="hero-card-preview-grid">
              {cardPreviews.map((card) => (
                <Link className="hero-card-chip" href={`/claim-card/${card.slug}`} key={card.slug}>
                  <span style={{ background: categoryMeta[card.category as CardCategory]?.color ?? "var(--theme-gold)" }} />
                  <strong>{card.title}</strong>
                  <small>{getCategoryDisplayName(card.category)}</small>
                </Link>
              ))}
            </div>
          </Reveal>
        </div>

        <HeroDashboardMockup />
      </section>

      <section className="section-shell" id="how-it-works">
        <div className="section-head">
          <div className="eyebrow">How it works</div>
          <h2 className="section-title">Recognition that moves</h2>
          <p className="section-copy">Real-world appreciation becomes digital visibility in four thoughtful steps.</p>
        </div>
        <div className="how-grid" style={{ marginTop: 30 }}>
          {[
            ["01", "Give a card", "Choose a card that matches the moment and the impact."],
            ["02", "Scan QR code", "They scan the QR code to access their digital experience."],
            ["03", "Claim recognition", "They see your message, claim the compliment, and feel seen."],
            ["04", "View growth & insights", "Recognition turns into insights that help your team grow."]
          ].map(([number, title, text], index) => (
            <Reveal className="how-step" key={title} delay={index * 0.05}>
              <span className="how-number">{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section-shell cards-teaser-section" id="cards">
        <div className="section-head">
          <div className="eyebrow">Cards</div>
          <h2 className="section-title">A card for every kind of impact</h2>
          <p className="section-copy">Browse the full GETH deck when you are ready, or claim a card directly from a QR scan.</p>
        </div>
        <div className="cards-teaser-row">
          {cardPreviews.map((card, index) => (
            <Reveal className="cards-teaser-card" key={card.slug} delay={index * 0.04}>
              <div className="card-library-meta">
                <span>{getCategoryDisplayName(card.category)}</span>
                <span>{String(card.cardNumber).padStart(2, "0")}</span>
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </Reveal>
          ))}
        </div>
        <div className="cards-teaser-actions">
          <Link className="btn btn-dark" href="/cards">Open card library <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="section-shell" id="for-companies" style={{ paddingTop: 0 }}>
        <div className="audience-grid">
          {[
            ["For companies", "Culture intelligence at scale.", "Build a culture of recognition that drives engagement, retention, and measurable impact.", "/company"],
            ["For managers", "See your team clearly.", "Spot what matters, celebrate often, and lead with data that helps your team thrive.", "/manager"],
            ["For employees", "Own your growth story.", "Feel valued, energized, and connected through everyday recognition.", "/employee"]
          ].map(([label, title, copy, href], index) => (
            <Reveal className="audience-card" key={label} delay={index * 0.05}>
              <div className="eyebrow">{label}</div>
              <h3>{title}</h3>
              <p>{copy}</p>
              <Link href={href} style={{ color: "var(--theme-ink)", fontWeight: 700 }}>
                Learn more <ArrowRight size={14} />
              </Link>
              <GoldenLeaves className="golden-leaves" />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section-shell cta-band">
        <div className="cta-copy">
          <div className="eyebrow">Ready to build a recognition culture?</div>
          <h2 className="section-title">Make recognition visible, measurable, and beautifully human.</h2>
        </div>
        <div className="hero-actions">
          <Link className="btn btn-primary" href="/book-demo">
            Book a demo <Sparkles size={16} />
          </Link>
          <Link className="btn btn-secondary" href="/pricing">
            View pricing
          </Link>
        </div>
      </section>
    </PublicSiteChrome>
  );
}
