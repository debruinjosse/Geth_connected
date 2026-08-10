"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const scrollLockY = useRef(0);
  const panelId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const scrollY = scrollLockY.current;
    document.body.classList.add("public-mobile-nav-open");
    document.body.dataset.scrollY = String(scrollY);
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      const savedScrollY = Number(document.body.dataset.scrollY || "0");
      document.body.classList.remove("public-mobile-nav-open");
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      delete document.body.dataset.scrollY;
      window.scrollTo(0, savedScrollY);
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
        onPointerDown={() => {
          if (!open) {
            scrollLockY.current = window.scrollY;
          }
        }}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {open ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
      </button>

      {mounted && open
        ? createPortal(
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
            </>,
            document.body
          )
        : null}
    </div>
  );
}
