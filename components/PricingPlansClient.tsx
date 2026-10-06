"use client";

import { useState } from "react";
import { Building2, Headset, Minus, Check, Rocket, ShieldCheck, UserRoundPlus } from "lucide-react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checklist } from "@/components/ui/Checklist";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { IconTile } from "@/components/ui/IconTile";
import { Pill } from "@/components/ui/Pill";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Table } from "@/components/ui/Table";
import { localizePublicHref } from "@/lib/navigation/public-nav";

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

export type PricingCompare = {
  title: string;
  featureHeading: string;
  columns: [string, string];
  /** string = shown as text, true = included, false = not included */
  rows: Array<{ label: string; values: [string | boolean, string | boolean] }>;
};

function CompareCell({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="lp-yes" aria-label="✓" strokeWidth={2.2} />;
  if (value === false) return <Minus className="lp-no" aria-label="–" />;
  return <>{value}</>;
}

export function PricingPlansClient({
  tiers,
  labels,
  trustItems,
  compare
}: {
  tiers: PricingTier[];
  labels: PricingLabels;
  trustItems: PricingTrustItem[];
  compare: PricingCompare;
}) {
  const locale = useLocale();
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const trustIcons = [ShieldCheck, Rocket, Headset];

  return (
    <>
      <div className="lp-rv" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 48 }}>
        <SegmentedControl
          label={labels.billingPeriod}
          value={cycle}
          onChange={setCycle}
          options={[
            { value: "monthly", label: labels.monthly, sublabel: labels.monthlySubcopy },
            { value: "yearly", label: labels.yearly, sublabel: labels.yearlySubcopy }
          ]}
        />
        <Pill tone="green">{labels.bestValue}</Pill>
      </div>

      <div className="lp-plans">
        {tiers.map((tier) => {
          const price = cycle === "monthly" ? tier.monthly : tier.yearly;
          const custom = tier.kind === "custom";
          const Icon = tier.icon === "enterprise" ? Building2 : UserRoundPlus;

          return (
            <Card as="article" size="lg" tone={custom ? "default" : "accent"} className="lp-plan lp-rv" key={tier.name}>
              <div className="lp-plan-top">
                <Eyebrow>{tier.name}</Eyebrow>
                <IconTile>
                  <Icon />
                </IconTile>
              </div>
              <h2 className="lp-plan-price">
                {custom ? (
                  labels.customPrice
                ) : (
                  <>
                    {price}
                    <small>{labels.priceSuffix}</small>
                  </>
                )}
              </h2>
              <p className="lp-plan-desc">{tier.description}</p>
              <hr />
              <Checklist items={tier.features} />
              <Button href={localizePublicHref(tier.ctaHref, locale)} variant={custom ? "ghost" : "primary"} arrow block>
                {tier.cta}
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="lp-trust-row">
        {trustItems.map((item, index) => {
          const Icon = trustIcons[index] ?? ShieldCheck;
          return (
            <div className="lp-trust-item lp-rv" key={item.title}>
              <IconTile>
                <Icon />
              </IconTile>
              <div>
                <b>{item.title}</b>
                <p>{item.copy}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="lp-rv" style={{ marginTop: 72 }}>
        <Table caption={compare.title}>
          <thead>
            <tr>
              <th scope="col">{compare.featureHeading}</th>
              <th scope="col" className="lp-c">
                {compare.columns[0]}
              </th>
              <th scope="col" className="lp-c">
                {compare.columns[1]}
              </th>
            </tr>
          </thead>
          <tbody>
            {compare.rows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td className="lp-c">
                  <CompareCell value={row.values[0]} />
                </td>
                <td className="lp-c">
                  <CompareCell value={row.values[1]} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  );
}
