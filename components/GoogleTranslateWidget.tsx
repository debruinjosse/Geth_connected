"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { locales, type AppLocale } from "@/i18n/routing";

const languageLabels: Record<AppLocale, string> = {
  nl: "Nederlands",
  en: "English"
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
  const pathname = usePathname() || "/nl";
  const [search, setSearch] = useState("");
  const pathLocale = pathname.split("/")[1];
  const activeLocale = ((locales as readonly string[]).includes(pathLocale) ? pathLocale : "nl") as AppLocale;

  useEffect(() => {
    setSearch(window.location.search || "");
  }, [pathname]);

  return (
    <nav className="google-translate-widget route-language-widget" aria-label="Choose language">
      {(locales as readonly AppLocale[]).map((locale) => {
        const href = `${getLocalizedPath(pathname, locale)}${search}`;

        return (
          <a className={locale === activeLocale ? "active" : ""} href={href} hrefLang={locale} key={locale} title={languageLabels[locale]}>
            {locale.toUpperCase()}
          </a>
        );
      })}
    </nav>
  );
}
