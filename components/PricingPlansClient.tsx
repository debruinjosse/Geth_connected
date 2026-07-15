"use client";

import { useState } from "react";
import { Check } from "lucide-react";

export type PricingTier = {
  name: string;
  monthly: string;
  yearly: string;
  yearlyNote: string;
  blurb: string;
  features: string[];
  featured?: boolean;
};

export function PricingPlansClient({
  tiers,
  labels,
  locale
}: {
  tiers: PricingTier[];
  labels: {
    monthly: string;
    yearly: string;
    choose: string;
    custom: string;
    perMonth: string;
    perYear: string;
    invoiceNote: string;
  };
  locale: string;
}) {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <>
      <div className="pricing-toggle" role="tablist" aria-label="Billing period">
        <button className={`quality-pill ${cycle === "monthly" ? "active" : ""}`.trim()} type="button" onClick={() => setCycle("monthly")}>
          {labels.monthly}
        </button>
        <button className={`quality-pill ${cycle === "yearly" ? "active" : ""}`.trim()} type="button" onClick={() => setCycle("yearly")}>
          {labels.yearly}
        </button>
      </div>

      <div className="pricing-grid">
        {tiers.map((tier) => {
          const price = cycle === "monthly" ? tier.monthly : tier.yearly;
          const period = price === labels.custom ? "" : cycle === "monthly" ? labels.perMonth : labels.perYear;

          return (
            <article className={`panel pricing-card ${tier.featured ? "featured" : ""}`.trim()} key={tier.name}>
              <div className="eyebrow">{tier.name}</div>
              <h2>{price}</h2>
              {period ? <span className="pricing-period">{period}</span> : null}
              {cycle === "yearly" && tier.yearlyNote ? <span className="quality-pill">{tier.yearlyNote}</span> : null}
              <p>{tier.blurb}</p>
              <div className="pricing-features">
                {tier.features.map((feature) => (
                  <span key={feature}>
                    <Check size={14} />
                    {feature}
                  </span>
                ))}
              </div>
              <a className={`btn ${tier.featured ? "btn-primary" : "btn-secondary"}`} href={`/${locale}/book-demo`}>
                {labels.choose} {tier.name}
              </a>
            </article>
          );
        })}
      </div>
      <p className="pricing-invoice-note">{labels.invoiceNote}</p>
    </>
  );
}
