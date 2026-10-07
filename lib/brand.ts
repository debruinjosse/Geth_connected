/** Canonical GETH crest — use this PNG everywhere (header, cards, dashboard, favicon). */
export const BRAND_MARK_SRC = "/assets/geth-crest-mark.png";


export const BRAND_MARK_ALT = "GETH® crest";

/** Display name with registered mark for plain-text contexts. */
export const BRAND_NAME = "GETH®";

/** Intrinsic crest proportions (128×118 source artwork). */
export const BRAND_MARK_WIDTH = 128;
export const BRAND_MARK_HEIGHT = 118;


export function brandMarkHeightForWidth(width: number) {
  return Math.round(width * (BRAND_MARK_HEIGHT / BRAND_MARK_WIDTH));
}
