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
  loginLabel: string;
  loginHref: string;
  bookDemoLabel: string;
  bookDemoHref: string;
  menuLabel: string;
  closeLabel: string;
  signedIn?: boolean;
  dashboardLabel?: string;
  dashboardHref?: string;
  signOutLabel?: string;
};

export function PublicMobileNav({
  links,
  loginLabel,
  loginHref,
  bookDemoLabel,
  bookDemoHref,
  menuLabel,
  closeLabel,
  signedIn = false,
  dashboardLabel,
  dashboardHref,
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

  const appLinks = signedIn && dashboardHref && dashboardLabel
    ? [{ href: dashboardHref, label: dashboardLabel }]
    : [{ href: loginHref, label: loginLabel }];

  return (
    <div className="public-mobile-nav">
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
            {[...links, ...appLinks].map((link) => (
              <a href={link.href} key={`${link.href}-${link.label}`} onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
            <a className="public-mobile-nav-primary" href={bookDemoHref} onClick={() => setOpen(false)}>
              {bookDemoLabel}
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
