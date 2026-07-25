"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { locales, type AppLocale } from "@/i18n/routing";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement?: new (
          options: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay: boolean;
            layout?: unknown;
          },
          elementId: string
        ) => void;
      };
    };
  }
}

const GOOGLE_TRANSLATE_SCRIPT_ID = "google-translate-script";
const GOOGLE_TRANSLATE_ELEMENT_ID = "google_translate_element";
const GOOGLE_TRANSLATE_SOURCE_LOCALE = "en";
const languageLabels: Record<AppLocale, string> = {
  en: "English",
  nl: "Dutch",
  fr: "French",
  da: "Danish"
};

function getLocalizedPath(pathname: string, nextLocale: AppLocale) {
  const parts = pathname.split("/");
  const currentLocale = parts[1];

  if ((locales as readonly string[]).includes(currentLocale)) {
    parts[1] = nextLocale;
    return parts.join("/") || `/${nextLocale}`;
  }

  return `/${nextLocale}${pathname === "/" ? "" : pathname}`;
}

function getTranslateCookieValue(locale: AppLocale) {
  return `/${GOOGLE_TRANSLATE_SOURCE_LOCALE}/${locale}`;
}

function getCookieDomainCandidates() {
  if (typeof window === "undefined") return [];

  const { hostname } = window.location;
  if (hostname === "localhost" || hostname.endsWith(".local") || /^[\d.]+$/.test(hostname)) {
    return [];
  }

  const parts = hostname.split(".");
  if (parts.length < 2) return [];

  return [`.${parts.slice(-2).join(".")}`];
}

function clearGoogleTranslateCookie() {
  document.cookie = "googtrans=;path=/;max-age=0;SameSite=Lax";
  for (const domain of getCookieDomainCandidates()) {
    document.cookie = `googtrans=;path=/;max-age=0;SameSite=Lax;domain=${domain}`;
  }
}

function writeGoogleTranslateCookie(locale: AppLocale) {
  if (locale === GOOGLE_TRANSLATE_SOURCE_LOCALE) {
    clearGoogleTranslateCookie();
    return;
  }

  const value = getTranslateCookieValue(locale);
  const maxAge = 60 * 60 * 24 * 365;
  const baseCookie = `googtrans=${value};path=/;max-age=${maxAge};SameSite=Lax`;

  document.cookie = baseCookie;
  for (const domain of getCookieDomainCandidates()) {
    document.cookie = `${baseCookie};domain=${domain}`;
  }
}

function applyGoogleTranslate(locale: AppLocale) {
  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!select) return false;

  if (locale === GOOGLE_TRANSLATE_SOURCE_LOCALE) {
    select.value = "";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  // Re-applying the same value helps Google translate newly rendered dashboard content after route changes.
  if (select.value === locale) {
    select.value = "";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  select.value = locale;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function applyGoogleTranslateWhenReady(locale: AppLocale, attempt = 0) {
  if (typeof window === "undefined") return;

  if (locale === GOOGLE_TRANSLATE_SOURCE_LOCALE) {
    clearGoogleTranslateCookie();
    applyGoogleTranslate(locale);
    return;
  }

  writeGoogleTranslateCookie(locale);

  if (applyGoogleTranslate(locale)) return;
  if (attempt >= 18) return;

  window.setTimeout(() => applyGoogleTranslateWhenReady(locale, attempt + 1), 250);
}

function ensureGoogleTranslateHost() {
  let host = document.getElementById(GOOGLE_TRANSLATE_ELEMENT_ID);
  if (host) return host;

  host = document.createElement("div");
  host.id = GOOGLE_TRANSLATE_ELEMENT_ID;
  host.setAttribute("aria-hidden", "true");
  host.style.position = "absolute";
  host.style.left = "-9999px";
  host.style.width = "1px";
  host.style.height = "1px";
  host.style.overflow = "hidden";
  document.body.appendChild(host);
  return host;
}

export function GoogleTranslateWidget() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const lastAppliedKey = useRef("");
  const pathname = usePathname() || "/en";
  const pathLocale = pathname.split("/")[1];
  const activeLocale = ((locales as readonly string[]).includes(pathLocale) ? pathLocale : "en") as AppLocale;

  useEffect(() => {
    setSearch(window.location.search || "");
  }, [pathname]);

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      const host = ensureGoogleTranslateHost();
      if (!window.google?.translate?.TranslateElement || host.children.length) {
        return;
      }

      new window.google.translate.TranslateElement(
        {
          pageLanguage: GOOGLE_TRANSLATE_SOURCE_LOCALE,
          includedLanguages: "en,nl,fr,da",
          autoDisplay: false
        },
        GOOGLE_TRANSLATE_ELEMENT_ID
      );

      applyGoogleTranslateWhenReady(activeLocale);
    };

    if (document.getElementById(GOOGLE_TRANSLATE_SCRIPT_ID)) {
      window.googleTranslateElementInit();
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_TRANSLATE_SCRIPT_ID;
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, [activeLocale]);

  useEffect(() => {
    const applyKey = `${activeLocale}:${pathname}`;
    if (lastAppliedKey.current === applyKey) return;
    lastAppliedKey.current = applyKey;

    applyGoogleTranslateWhenReady(activeLocale);
  }, [activeLocale, pathname]);

  function handleLanguageSelect(event: MouseEvent<HTMLAnchorElement>, locale: AppLocale, href: string) {
    event.preventDefault();
    writeGoogleTranslateCookie(locale);
    applyGoogleTranslate(locale);
    setOpen(false);

    window.location.assign(href);
  }

  return (
    <div className={`google-translate-widget ${open ? "open" : ""}`.trim()}>
      {open ? (
        <div className="google-translate-panel">
          <div className="google-translate-head">
            <strong>Choose language</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close translation panel">
              <X size={15} />
            </button>
          </div>
          <p>Select a language to translate the website and dashboards.</p>
          <div className="google-language-options" aria-label="Language choices">
            {(locales as readonly AppLocale[]).map((locale) => {
              const href = `${getLocalizedPath(pathname, locale)}${search}`;

              return (
                <a
                  className={locale === activeLocale ? "active" : ""}
                  href={href}
                  hrefLang={locale}
                  key={locale}
                  onClick={(event) => handleLanguageSelect(event, locale, href)}
                >
                  <span>{locale.toUpperCase()}</span>
                  {languageLabels[locale]}
                </a>
              );
            })}
          </div>
        </div>
      ) : null}
      <button className="google-translate-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-label="Translate website">
        <span>Translate</span>
        <strong className="google-translate-current">{activeLocale.toUpperCase()}</strong>
      </button>
    </div>
  );
}
