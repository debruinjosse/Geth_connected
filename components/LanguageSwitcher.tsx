"use client";

import { useEffect, useState } from "react";
import { locales, type AppLocale } from "@/i18n/routing";

const languageLabels: Record<AppLocale, string> = {
  en: "EN",
  nl: "NL",
  fr: "FR",
  da: "DA"
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

export function LanguageSwitcher({ floating = false }: { floating?: boolean }) {
  const [locationState, setLocationState] = useState({ pathname: "/en", search: "" });
  const { pathname, search } = locationState;
  const activeLocale = (pathname.split("/")[1] || "en") as AppLocale;

  useEffect(() => {
    setLocationState({
      pathname: window.location.pathname || "/en",
      search: window.location.search || ""
    });
  }, []);

  return (
    <nav className={`language-switcher ${floating ? "floating" : ""}`.trim()} aria-label="Choose language">
      {(locales as readonly AppLocale[]).map((locale) => {
        const href = `${getLocalizedPath(pathname, locale)}${search}`;

        return (
          <a className={locale === activeLocale ? "active" : ""} href={href} hrefLang={locale} key={locale}>
            {languageLabels[locale]}
          </a>
        );
      })}
    </nav>
  );
}
