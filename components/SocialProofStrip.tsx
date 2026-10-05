const statsByLocale: Record<string, { value: string; label: string }[]> = {
  en: [
    { value: "53", label: "recognition cards" },
    { value: "5", label: "impact categories" },
    { value: "1", label: "QR scan to claim" }
  ],
  nl: [
    { value: "53", label: "waarderingskaarten" },
    { value: "5", label: "impact categorieën" },
    { value: "1", label: "QR-scan om te claimen" }
  ]
};

/** Placeholder social-proof row — swap for real logos/numbers when available. */
export function SocialProofStrip({ locale = "en" }: { locale?: string }) {
  const stats = statsByLocale[locale] ?? statsByLocale.en;

  return (
    <div className="gt-social-proof">
      <div className="gt-container gt-social-proof-inner">
        {stats.map((stat) => (
          <span key={stat.label}>
            <strong>{stat.value}</strong> {stat.label}
          </span>
        ))}
      </div>
    </div>
  );
}
