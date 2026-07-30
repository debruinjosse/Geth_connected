export function localizedLoginPath(locale: string, nextPath?: string) {
  const base = `/${locale}/login`;
  if (!nextPath) return base;
  return `${base}?next=${encodeURIComponent(nextPath)}`;
}
