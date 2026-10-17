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
  contactLabel: string;
  contactHref: string;
  linkedinLabel: string;
  linkedinHref?: string;
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
  mainNavLabel,
  contactLabel,
  contactHref,
  linkedinLabel,
  linkedinHref
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
          <a href={contactHref} className="lp-icon-btn" aria-label={contactLabel} title={contactLabel}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3.5 7 8.5 6 8.5-6" />
            </svg>
          </a>
          {linkedinHref ? (
            <a href={linkedinHref} className="lp-icon-btn" aria-label={linkedinLabel} title={linkedinLabel} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11.5H3V9.75Zm6.5 0h3.83v1.57h.06c.53-1 1.84-2.07 3.78-2.07 4.04 0 4.78 2.66 4.78 6.12v5.88h-4v-5.2c0-1.24-.02-2.83-1.73-2.83-1.73 0-2 1.35-2 2.74v5.29h-4V9.75Z" />
              </svg>
            </a>
          ) : null}
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
        <a className="lp-m" href={contactHref} onClick={() => setOpen(false)}>
          {contactLabel}
        </a>
        {linkedinHref ? (
          <a className="lp-m" href={linkedinHref} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
            LinkedIn
          </a>
        ) : null}
        <Button href={primaryHref} onClick={() => setOpen(false)}>
          {primaryLabel}
        </Button>
      </div>
    </header>
  );
}
