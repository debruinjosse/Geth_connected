import Image from "next/image";
import type { ComponentPropsWithoutRef } from "react";
import {
  BRAND_MARK_ALT,
  BRAND_MARK_SRC,
  brandMarkHeightForWidth
} from "@/lib/brand";

/** Crest mark at any display width (same PNG as the header logo). */
export function BrandMarkIcon({
  size = 30,
  className,
  alt = BRAND_MARK_ALT,
  ...rest
}: {
  size?: number;
  className?: string;
  alt?: string;
} & Omit<ComponentPropsWithoutRef<typeof Image>, "alt" | "className" | "height" | "src" | "width">) {
  const height = brandMarkHeightForWidth(size);

  return (
    <Image
      alt={alt}
      className={className}
      src={BRAND_MARK_SRC}
      width={size}
      height={height}
      {...rest}
    />
  );
}

export function BrandLogo({
  dark = false,
  compact = false,
  href = "/",
  interactive = true
}: {
  dark?: boolean;
  compact?: boolean;
  href?: string;
  interactive?: boolean;
}) {
  const markWidth = compact ? 40 : 58;
  const markHeight = brandMarkHeightForWidth(markWidth);

  const image = (
    <Image
      alt={BRAND_MARK_ALT}
      className="brand-symbol"
      src={BRAND_MARK_SRC}
      width={markWidth}
      height={markHeight}
      sizes={`${markWidth}px`}
    />
  );
  const wordmark = (
    <span className="brand-copy">
      <span className="brand-wordmark">GETH</span>
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
