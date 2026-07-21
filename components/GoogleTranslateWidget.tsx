"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Languages, X } from "lucide-react";
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

export function GoogleTranslateWidget() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const pathname = usePathname() || "/en";
  const pathLocale = pathname.split("/")[1];
  const activeLocale = ((locales as readonly string[]).includes(pathLocale) ? pathLocale : "en") as AppLocale;

  useEffect(() => {
    setSearch(window.location.search || "");
  }, [pathname]);

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement || document.getElementById("google_translate_element")?.children.length) {
        return;
      }

      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,nl,fr,da",
          autoDisplay: false
        },
        "google_translate_element"
      );
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
  }, []);

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
          <p>Select a language. The page will switch to the matching GETH route, and Google Translate remains available below if needed.</p>
          <div className="google-language-options" aria-label="Language choices">
            {(locales as readonly AppLocale[]).map((locale) => (
              <a
                className={locale === activeLocale ? "active" : ""}
                href={`${getLocalizedPath(pathname, locale)}${search}`}
                hrefLang={locale}
                key={locale}
              >
                <span>{locale.toUpperCase()}</span>
                {languageLabels[locale]}
              </a>
            ))}
          </div>
          <div id="google_translate_element" />
        </div>
      ) : null}
      <button className="google-translate-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-label="Translate website">
        <Languages size={18} />
        <span>Translate</span>
        <strong className="google-translate-current">{activeLocale.toUpperCase()}</strong>
      </button>
    </div>
  );
}
