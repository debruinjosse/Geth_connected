export function parseTwoPartHeadline(raw: string): { line1: string; line2: string } | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(.+?)\.\s+(.+)$/);
  if (!match) return null;

  const first = match[1].trim();
  const second = match[2].trim();
  if (!first || !second) return null;
  if (first.split(/\s+/).length > 4 || second.split(/\s+/).length > 4) return null;

  return {
    line1: first.endsWith(".") ? first : `${first}.`,
    line2: second.endsWith(".") ? second : `${second}.`
  };
}

export function splitHeadlinePhrase(phrase: string) {
  const trimmed = phrase.trim();
  const spaceIndex = trimmed.indexOf(" ");

  if (spaceIndex === -1) {
    return { lead: trimmed, rest: "" };
  }

  return {
    lead: trimmed.slice(0, spaceIndex),
    rest: trimmed.slice(spaceIndex + 1)
  };
}

export function resolveHeroHeadlineLines(
  overrides: Record<string, string>,
  text: (key: string) => string
) {
  const fromCta = overrides.ctaTitle?.trim() ? parseTwoPartHeadline(overrides.ctaTitle) : null;
  if (fromCta) return fromCta;

  const fromText = parseTwoPartHeadline(text("ctaTitle"));
  if (fromText) return fromText;

  return {
    line1: text("headlineLine1"),
    line2: text("headlineLine2")
  };
}
