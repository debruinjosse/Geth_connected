import Link from "next/link";
import { Check } from "lucide-react";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";

const tiers = [
  { name: "Starter", price: "$12", blurb: "For small teams proving recognition habits.", features: ["Connected cards starter deck", "Employee dashboard", "Basic claim analytics"] },
  { name: "Growth", price: "$29", blurb: "For growing companies that want manager and company insights.", features: ["Manager workspace", "Signals and reports", "Cards & decks management"], featured: true },
  { name: "Enterprise", price: "Custom", blurb: "For multi-team organizations and enterprise rollouts.", features: ["Advanced admin controls", "Custom card programs", "Priority onboarding & support"] }
];

export default function PricingPage() {
  return (
    <PublicSiteChrome>
      <section className="section-shell page-shell">
        <div className="section-head">
          <div className="eyebrow">Pricing</div>
          <h1 className="section-title">Plans for recognition cultures at every stage</h1>
          <p className="section-copy">Switch between monthly and yearly in a connected product flow later. For now, the pricing UI is demo-ready and fully styled.</p>
        </div>
        <div className="pricing-toggle">
          <span className="quality-pill active">Monthly</span>
          <span className="quality-pill">Yearly</span>
        </div>
        <div className="pricing-grid">
          {tiers.map((tier) => (
            <article className={`panel pricing-card ${tier.featured ? "featured" : ""}`.trim()} key={tier.name}>
              <div className="eyebrow">{tier.name}</div>
              <h2>{tier.price}</h2>
              <p>{tier.blurb}</p>
              <div className="pricing-features">
                {tier.features.map((feature) => (
                  <span key={feature}>
                    <Check size={14} />
                    {feature}
                  </span>
                ))}
              </div>
              <Link className={`btn ${tier.featured ? "btn-primary" : "btn-secondary"}`} href="/book-demo">
                Choose {tier.name}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </PublicSiteChrome>
  );
}
