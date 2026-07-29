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
  const image = (
      <Image
        alt="GETH crest"
        className="brand-symbol"
        src="/assets/geth-crest-mark.png"
        width={compact ? 34 : 50}
        height={compact ? 31 : 46}
        sizes={compact ? "34px" : "50px"}
      />
  );
  const wordmark = (
      <span className="brand-copy">
        <span className="brand-wordmark">GETH</span>
        {tagline ? <span className="brand-tagline">Recognize to energize.</span> : null}
      </span>
  );

  if (!interactive) {
    return (
      <span className={`brand-logo ${dark ? "dark" : ""} ${compact ? "compact" : ""}`.trim()}>
        {image}
        {wordmark}
      </span>
    );
  }

  return (
    <span className={`brand-logo ${dark ? "dark" : ""} ${compact ? "compact" : ""}`.trim()}>
      <a className="brand-symbol-link" href={href} aria-label="Back to home">
        {image}
      </a>
      <a className="brand-wordmark-link" href={href} aria-label="Back to home">
        {wordmark}
      </a>
    </span>
  );
}
