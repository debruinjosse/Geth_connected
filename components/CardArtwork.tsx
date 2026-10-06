import Image from "next/image";
import { cx } from "@/components/ui/cx";

export type CardArtworkKind = "content" | "cover";

/** Path of the exported card artwork (see scripts/export-card-art.mjs). */
export function cardArtworkSrc(cardNumber: number, locale: string, kind: CardArtworkKind = "content") {
  const lang = locale === "nl" ? "nl" : "en";
  return `/cards/${lang}/card_${String(cardNumber).padStart(2, "0")}_${kind}.webp`;
}

/** The real GETH card artwork (512×749), localised, with a soft shadow and rounded corners. */
export function CardArtwork({
  cardNumber,
  locale,
  title,
  kind = "content",
  priority = false,
  className,
  sizes = "(max-width: 640px) 46vw, 260px"
}: {
  cardNumber: number;
  locale: string;
  title: string;
  kind?: CardArtworkKind;
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  return (
    <Image
      className={cx("lp-artwork", className)}
      src={cardArtworkSrc(cardNumber, locale, kind)}
      alt={title}
      width={512}
      height={749}
      sizes={sizes}
      priority={priority}
      unoptimized
    />
  );
}
