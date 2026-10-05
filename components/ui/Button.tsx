import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "text-link";

type CommonProps = {
  variant?: ButtonVariant;
  size?: "default" | "hero";
  children: React.ReactNode;
  className?: string;
};

type ButtonAsLink = CommonProps & { href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className">;
type ButtonAsButton = CommonProps & { href?: undefined } & Omit<ComponentPropsWithoutRef<"button">, "className">;

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant = "primary", size = "default", children, className, ...rest } = props;
  const classes = ["gt-btn", `gt-btn-${variant}`, size === "hero" ? "gt-btn-hero" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  const content =
    variant === "text-link" ? (
      <>
        <span>{children}</span>
        <ArrowRight size={15} className="gt-btn-text-link-arrow" aria-hidden="true" />
      </>
    ) : (
      children
    );

  if ("href" in props && props.href) {
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
