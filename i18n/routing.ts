import { defineRouting } from "next-intl/routing";

export const locales = ["en", "nl", "fr", "da"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always"
});

export function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}

export function stripLocaleFromPathname(pathname: string) {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];

  if (maybeLocale && isAppLocale(maybeLocale)) {
    const stripped = `/${segments.slice(2).join("/")}`.replace(/\/+$/, "");
    return stripped || "/";
  }

  return pathname;
}

export function getLocaleFromPathname(pathname: string): AppLocale | null {
  const maybeLocale = pathname.split("/")[1];
  return maybeLocale && isAppLocale(maybeLocale) ? maybeLocale : null;
}
