"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AppLocale } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

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
          <LanguageToggle locale={locale} label={languageLabel} />
          <Button href={primaryHref} size="sm">
            {primaryLabel}
          </Button>
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
        <Button href={primaryHref} onClick={() => setOpen(false)}>
          {primaryLabel}
        </Button>
      </div>
    </header>
  );
}
