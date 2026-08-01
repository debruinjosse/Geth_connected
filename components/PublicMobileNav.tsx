"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { GoogleTranslateWidget } from "@/components/GoogleTranslateWidget";

type MobileLink = {
  label: string;
  href: string;
};

export type PublicMobileNavProps = {
  links: MobileLink[];
  primaryLabel: string;
  primaryHref: string;
  menuLabel: string;
  closeLabel: string;
  signedIn?: boolean;
  secondaryLabel?: string;
  secondaryHref?: string;
  signOutLabel?: string;
};

export function PublicMobileNav({
  links,
  primaryLabel,
  primaryHref,
  menuLabel,
  closeLabel,
  signedIn = false,
  secondaryLabel,
  secondaryHref,
  signOutLabel
}: PublicMobileNavProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const secondaryLinks =
    secondaryLabel && secondaryHref ? [{ href: secondaryHref, label: secondaryLabel }] : [];

  return (
    <div className="public-mobile-nav">
      {signedIn ? (
        <a className="public-mobile-dashboard-cta" href={primaryHref}>
          {primaryLabel}
        </a>
      ) : null}
      <GoogleTranslateWidget />
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={open ? closeLabel : menuLabel}
        className="public-mobile-nav-toggle"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {open ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
      </button>

      {open ? (
        <>
          <button
            aria-label={closeLabel}
            className="public-mobile-nav-backdrop"
            onClick={() => setOpen(false)}
            type="button"
          />
          <nav className="public-mobile-nav-panel" id={panelId} aria-label={menuLabel}>
            {[...links, ...secondaryLinks].map((link) => (
              <a href={link.href} key={`${link.href}-${link.label}`} onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
            <a className="public-mobile-nav-primary" href={primaryHref} onClick={() => setOpen(false)}>
              {primaryLabel}
            </a>
            {signedIn && signOutLabel ? (
              <a href="/auth/signout" onClick={() => setOpen(false)}>
                {signOutLabel}
              </a>
            ) : null}
            <div className="public-mobile-nav-language">
              <GoogleTranslateWidget />
            </div>
          </nav>
        </>
      ) : null}
    </div>
  );
}
