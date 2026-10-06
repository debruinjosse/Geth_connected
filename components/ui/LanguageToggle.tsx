"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales, type AppLocale } from "@/i18n/routing";

function getLocalizedPath(pathname: string, nextLocale: AppLocale) {
  const parts = pathname.split("/");
  if ((locales as readonly string[]).includes(parts[1])) {
    parts[1] = nextLocale;
    return parts.join("/") || `/${nextLocale}`;
  }
  return `/${nextLocale}${pathname === "/" ? "" : pathname}`;
}

/** NL | EN pill. Keeps the current path, query string and hash. */
export function LanguageToggle({ locale, label }: { locale: AppLocale; label: string }) {
  const router = useRouter();
  const pathname = usePathname() || `/${locale}`;

  function switchLocale(next: AppLocale) {
    if (next === locale) return;
    router.push(`${getLocalizedPath(pathname, next)}${window.location.search}${window.location.hash}`);
  }

  return (
    <div className="lp-lang" role="group" aria-label={label}>
      {(locales as readonly AppLocale[]).map((item) => (
        <button key={item} type="button" aria-pressed={item === locale} onClick={() => switchLocale(item)}>
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
