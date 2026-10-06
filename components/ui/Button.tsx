import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "@/components/ui/cx";

export type ButtonVariant = "primary" | "ghost" | "gold";

type CommonProps = {
  variant?: ButtonVariant;
  size?: "md" | "sm" | "lg";
  /** Full-width button. */
  block?: boolean;
  /** Trailing arrow that nudges on hover. */
  arrow?: boolean;
  /** Leading icon element (sized by CSS). */
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
};

type ButtonAsLink = CommonProps & { href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">;
type ButtonAsButton = CommonProps & { href?: undefined } & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">;

export function buttonClass({
  variant = "primary",
  size = "md",
  block,
  className
}: Pick<CommonProps, "variant" | "size" | "block" | "className">) {
  return cx("lp-btn", `lp-btn-${variant}`, size === "sm" && "lp-btn-sm", size === "lg" && "lp-btn-lg", block && "lp-btn-block", className);
}

export const ArrowIcon = (
  <svg className="lp-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

/** The one button of the GETH design system — renders a link when `href` is given. */
export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant, size, block, arrow, icon, className, children, ...rest } = props;
  const classes = buttonClass({ variant, size, block, className });
  const content =
    arrow || icon ? (
      <>
        {icon}
        <span>{children}</span>
        {arrow ? ArrowIcon : null}
      </>
    ) : (
      children
    );

  if ("href" in props && props.href !== undefined) {
    const { href, ...linkRest } = rest as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...linkRest}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...(rest as ButtonAsButton)}>
      {content}
    </button>
  );
}
