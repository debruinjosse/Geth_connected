"use client";

import { useState } from "react";
import { Building2, Check, UserRoundPlus, UsersRound } from "lucide-react";

export type PricingTier = {
  name: string;
  monthly: string;
  yearly: string;
  icon: "team" | "growth" | "enterprise";
  features: string[];
  featured?: boolean;
};

function PricingIcon({ icon }: { icon: PricingTier["icon"] }) {
  const Icon = icon === "enterprise" ? Building2 : icon === "growth" ? UserRoundPlus : UsersRound;
  return (
    <span className="pricing-plan-icon">
      <Icon size={25} strokeWidth={1.8} />
    </span>
  );
}

export function PricingPlansClient({
  tiers,
  labels,
  locale
}: {
  tiers: PricingTier[];
  labels: {
    monthly: string;
    yearly: string;
    yearlySubcopy: string;
    bestValue: string;
    contact: string;
    perEmployee: string;
    customPricing: string;
    mostPopular: string;
  };
  locale: string;
}) {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <>
      <div className="pricing-toggle-wrap">
        <div className="pricing-toggle" role="tablist" aria-label="Billing period">
          <button className={cycle === "monthly" ? "active" : ""} type="button" onClick={() => setCycle("monthly")}>
            {labels.monthly}
          </button>
          <button className={cycle === "yearly" ? "active" : ""} type="button" onClick={() => setCycle("yearly")}>
            <span>{labels.yearly}</span>
            <small>{labels.yearlySubcopy}</small>
          </button>
          <span className="pricing-best-value">{labels.bestValue}</span>
        </div>
      </div>

      <div className="pricing-grid pricing-plan-grid">
        {tiers.map((tier) => {
          const price = cycle === "monthly" ? tier.monthly : tier.yearly;
          const custom = price === "Custom";

          return (
            <article className={`pricing-plan-card ${tier.featured ? "featured" : ""}`.trim()} key={tier.name}>
              {tier.featured ? <div className="pricing-popular-ribbon">{labels.mostPopular}</div> : null}
              <div className="pricing-plan-top">
                <div className="eyebrow">{tier.name}</div>
                <PricingIcon icon={tier.icon} />
              </div>
              <div className="pricing-price-block">
                <h2>{custom ? "Custom" : price}</h2>
                <p>{custom ? labels.customPricing : labels.perEmployee}</p>
              </div>
              <div className="pricing-feature-divider" />
              <div className="pricing-features">
                {tier.features.map((feature, index) => (
                  <span className={tier.featured && index >= 3 ? "highlight" : ""} key={feature}>
                    <Check size={13} />
                    {feature}
                  </span>
                ))}
              </div>
              <a className="btn btn-dark pricing-contact-button" href={`/${locale}/book-demo`}>
                {labels.contact}
              </a>
            </article>
          );
        })}
      </div>
    </>
  );
}
