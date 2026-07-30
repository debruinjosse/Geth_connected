"use client";

type InfinityValueStripProps = {
  items: string[];
  className?: string;
};

export function InfinityValueStrip({ items, className }: InfinityValueStripProps) {
  if (!items.length) return null;

  const loop = [...items, ...items];
  const sectionClassName = ["infinity-strip", className].filter(Boolean).join(" ");

  return (
    <section className={sectionClassName} aria-label="GETH recognition highlights">
      <div className="infinity-strip-fade infinity-strip-fade-left" aria-hidden="true" />
      <div className="infinity-strip-fade infinity-strip-fade-right" aria-hidden="true" />
      <div className="infinity-strip-track">
        {loop.map((item, index) => (
          <span className="infinity-strip-chip" key={`${item}-${index}`}>
            <span className="infinity-strip-text">{item}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
