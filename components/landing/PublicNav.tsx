"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { locales, type AppLocale } from "@/i18n/routing";

type NavLink = { href: string; label: string };

export type PublicNavProps = {
  locale: AppLocale;
  homeHref: string;
  links: NavLink[];
  secondaryLabel: string;
  secondaryHref: string;
  primaryLabel: string;
  primaryHref: string;
  menuLabel: string;
  closeLabel: string;
  languageLabel: string;
  mainNavLabel: string;
};

function getLocalizedPath(pathname: string, nextLocale: AppLocale) {
  const parts = pathname.split("/");
  if ((locales as readonly string[]).includes(parts[1])) {
    parts[1] = nextLocale;
    return parts.join("/") || `/${nextLocale}`;
  }
  return `/${nextLocale}${pathname === "/" ? "" : pathname}`;
}

export function PublicNav({
  locale,
  homeHref,
  links,
  secondaryLabel,
  secondaryHref,
  primaryLabel,
  primaryHref,
  menuLabel,
  closeLabel,
  languageLabel,
  mainNavLabel
}: PublicNavProps) {
  const router = useRouter();
  const pathname = usePathname() || `/${locale}`;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function switchLocale(next: AppLocale) {
    if (next === locale) return;
    router.push(`${getLocalizedPath(pathname, next)}${window.location.search}${window.location.hash}`);
  }

  return (
    <header className={`lp lp-nav${scrolled ? " lp-scrolled" : ""}`}>
      <div className="lp-wrap lp-nav-in">
        <Link href={homeHref} className="lp-brand" aria-label="GETH®">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/landing/geth-crest.svg" alt="" />
          <b>
            GETH<sup>®</sup>
          </b>
        </Link>
        <nav className="lp-nav-links" aria-label={mainNavLabel}>
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="lp-nav-end">
          <Link href={secondaryHref} className="lp-login">
            {secondaryLabel}
          </Link>
          <div className="lp-lang" role="group" aria-label={languageLabel}>
            {(locales as readonly AppLocale[]).map((item) => (
              <button key={item} type="button" aria-pressed={item === locale} onClick={() => switchLocale(item)}>
                {item.toUpperCase()}
              </button>
            ))}
          </div>
          <Link href={primaryHref} className="lp-btn lp-btn-primary lp-btn-sm">
            {primaryLabel}
          </Link>
          <button
            type="button"
            className="lp-burger"
            aria-label={open ? closeLabel : menuLabel}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
          </button>
        </div>
      </div>
      <div className={`lp-menu${open ? " lp-open" : ""}`}>
        {links.map((link) => (
          <Link key={link.href} className="lp-m" href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </Link>
        ))}
        <Link className="lp-m" href={secondaryHref} onClick={() => setOpen(false)}>
          {secondaryLabel}
        </Link>
        <Link className="lp-btn lp-btn-primary" href={primaryHref} onClick={() => setOpen(false)}>
          {primaryLabel}
        </Link>
      </div>
    </header>
  );
}
