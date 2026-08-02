export function getDateLocale(locale?: string) {
  return locale === "nl" ? "nl-NL" : "en-US";
}

export function getRecentMonthLabels(count: number, locale?: string) {
  const dateLocale = getDateLocale(locale);
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    return new Intl.DateTimeFormat(dateLocale, { month: "short" }).format(date);
  });
}

export function extractLocaleFromPathname(pathname: string) {
  const match = pathname.match(/^\/(en|nl)(\/|$)/);
  return match?.[1] ?? "en";
}
