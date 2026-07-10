"use client";

import Image from "next/image";

export function BrandLogo({
  dark = false,
  compact = false,
  tagline = false,
  href = "/",
  interactive = true
}: {
  dark?: boolean;
  compact?: boolean;
  tagline?: boolean;
  href?: string;
  interactive?: boolean;
}) {
  const content = (
    <>
      <Image
        alt="GETH crest"
        className="brand-symbol"
        src="/assets/geth-crest-mark.png"
        width={compact ? 34 : 50}
        height={compact ? 31 : 46}
        priority
      />
      <span className="brand-copy">
        <span className="brand-wordmark">GETH</span>
        {tagline ? <span className="brand-tagline">Recognize to energize.</span> : null}
      </span>
    </>
  );

  if (!interactive) {
    return <span className={`brand-logo ${dark ? "dark" : ""} ${compact ? "compact" : ""}`.trim()}>{content}</span>;
  }

  return (
    <a className={`brand-logo ${dark ? "dark" : ""} ${compact ? "compact" : ""}`.trim()} href={href} aria-label="GETH">
      {content}
    </a>
  );
}
