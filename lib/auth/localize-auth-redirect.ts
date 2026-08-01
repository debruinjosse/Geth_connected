import { defaultLocale, isAppLocale } from "@/i18n/routing";

export function localizeAuthRedirect(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) {
    return path;
  }

  const [pathname, ...queryParts] = path.split("?");
  const query = queryParts.length > 0 ? `?${queryParts.join("?")}` : "";
  const firstSegment = pathname.split("/")[1];

  if (firstSegment && isAppLocale(firstSegment)) {
    return path;
  }

  const localizedPath = pathname === "/" ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`;
  return `${localizedPath}${query}`;
}
