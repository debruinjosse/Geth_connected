/** Canonical GETH crest — use this PNG everywhere (header, cards, dashboard, favicon). */
export const BRAND_MARK_SRC = "/assets/geth-crest-mark.png";

/** Same crest for raster-only contexts (favicon, Apple touch). */
export const BRAND_MARK_PNG = "/assets/geth-crest-mark.png";

export const BRAND_MARK_ALT = "GETH® crest";

/** Display name with registered mark for plain-text contexts. */
export const BRAND_NAME = "GETH®";

/** Intrinsic crest proportions (128×118 source artwork). */
export const BRAND_MARK_WIDTH = 128;
export const BRAND_MARK_HEIGHT = 118;

/** Team recognition hero used on landing and pre-footer band. */
export const RECOGNITION_MOMENT_SRC = "/assets/geth-recognition-moment.png";
export const RECOGNITION_MOMENT_ALT = "Team celebrating a GETH® recognition moment with Get Certified certificate";

export function brandMarkHeightForWidth(width: number) {
  return Math.round(width * (BRAND_MARK_HEIGHT / BRAND_MARK_WIDTH));
}
