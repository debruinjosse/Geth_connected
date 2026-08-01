"use client";

import type { CSSProperties } from "react";
import type { MarqueeDividerStyle } from "@/lib/marquee-config";

type InfinityValueStripProps = {
  items: string[];
  className?: string;
  enabled?: boolean;
  scrollSpeed?: number;
  backgroundColor?: string;
  textColor?: string;
  dividerStyle?: MarqueeDividerStyle;
};

export function InfinityValueStrip({
  items,
  className,
  enabled = true,
  scrollSpeed = 42,
  backgroundColor,
  textColor,
  dividerStyle = "line"
}: InfinityValueStripProps) {
  if (!enabled || !items.length) return null;

  const sectionStyle: CSSProperties & Record<string, string> = {
    "--infinity-strip-duration": `${scrollSpeed}s`
  };

  if (backgroundColor) {
    sectionStyle.background = backgroundColor;
    sectionStyle["--infinity-strip-fade-color"] = backgroundColor;
  }

  if (textColor) {
    sectionStyle["--infinity-strip-text-color"] = textColor;
  }

  const loop = [...items, ...items];
  const sectionClassName = [
    "infinity-strip",
    `infinity-strip-divider-${dividerStyle}`,
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={sectionClassName} aria-label="GETH recognition highlights" style={sectionStyle}>
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
