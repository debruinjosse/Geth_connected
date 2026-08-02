"use client";

import { useState } from "react";
import { ArrowRight, Building2, Check, Headset, Rocket, ShieldCheck, UserRoundPlus } from "lucide-react";
import { Link } from "@/i18n/navigation";

export type PricingTier = {
  name: string;
  monthly: string;
  yearly: string;
  icon: "growth" | "enterprise";
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  kind: "growth" | "custom";
};

export type PricingLabels = {
  monthly: string;
  monthlySubcopy: string;
  yearly: string;
  yearlySubcopy: string;
  bestValue: string;
  billingPeriod: string;
  customPrice: string;
  priceSuffix: string;
};

export type PricingTrustItem = {
  title: string;
  copy: string;
};

function PricingIcon({ icon }: { icon: PricingTier["icon"] }) {
  const Icon = icon === "enterprise" ? Building2 : UserRoundPlus;
  return (
    <span className="pricing-plan-icon">
      <Icon size={25} strokeWidth={1.8} />
    </span>
  );
}

export function PricingPlansClient({
  tiers,
  labels,
  trustItems
}: {
  tiers: PricingTier[];
  labels: PricingLabels;
  trustItems: PricingTrustItem[];
}) {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const trustIcons = [ShieldCheck, Rocket, Headset];

  return (
    <>
      <div className="pricing-toggle-wrap">
        <div className="pricing-toggle" role="tablist" aria-label={labels.billingPeriod}>
          <button className={cycle === "monthly" ? "active" : ""} type="button" onClick={() => setCycle("monthly")}>
            <span>{labels.monthly}</span>
            <small>{labels.monthlySubcopy}</small>
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
          const custom = tier.kind === "custom";

          return (
            <article className="pricing-plan-card" key={tier.name}>
              <div className="pricing-plan-top">
                <div className="eyebrow pricing-plan-eyebrow">{tier.name}</div>
                <PricingIcon icon={tier.icon} />
              </div>
              <div className="pricing-price-block">
                <h2>
                  {custom ? (
                    labels.customPrice
                  ) : (
                    <>
                      {price}
                      <span className="pricing-price-suffix">{labels.priceSuffix}</span>
                    </>
                  )}
                </h2>
              </div>
              <p className="pricing-plan-description">{tier.description}</p>
              <div className="pricing-feature-divider" />
              <div className="pricing-features">
                {tier.features.map((feature) => (
                  <span key={feature}>
                    <Check size={13} />
                    {feature}
                  </span>
                ))}
              </div>
              <Link className="btn btn-primary pricing-contact-button" href={tier.ctaHref}>
                {tier.cta} <ArrowRight size={16} />
              </Link>
            </article>
          );
        })}
      </div>

      <div className="pricing-trust-bar">
        {trustItems.map((item, index) => {
          const Icon = trustIcons[index] ?? ShieldCheck;
          return (
            <div className="pricing-trust-item" key={item.title}>
              <span className="pricing-trust-icon" aria-hidden="true">
                <Icon size={22} strokeWidth={1.8} />
              </span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.copy}</p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
