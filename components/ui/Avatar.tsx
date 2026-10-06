import Image from "next/image";
import { cx } from "@/components/ui/cx";

/** Round initials / photo avatar. */
export function Avatar({
  name,
  initials,
  imageUrl,
  size = "md",
  className
}: {
  name?: string;
  initials?: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const px = size === "sm" ? 32 : size === "lg" ? 56 : size === "xl" ? 88 : 40;
  const text = initials || (name ? name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() : "");

  return (
    <span className={cx("lp-avatar", `lp-avatar-${size}`, className)} aria-hidden={imageUrl ? undefined : "true"}>
      {imageUrl ? <Image src={imageUrl} alt={name ?? ""} width={px} height={px} unoptimized /> : text}
    </span>
  );
}
