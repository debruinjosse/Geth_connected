import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const cardsTs = fs.readFileSync(path.join(root, "lib/cards.ts"), "utf8");
const sql = fs.readFileSync(path.join(root, "supabase/migrations/001_geth_schema.sql"), "utf8");

const slugs = [...cardsTs.matchAll(/"slug": "([^"]+)"/g)].map((m) => m[1]);
const descs = [...cardsTs.matchAll(/"description": "([^"]+)"/g)].map((m) => m[1]);
const sents = [...cardsTs.matchAll(/"recognitionSentence": "([^"]+)"/g)].map((m) => m[1]);

const nlBySlug = {};
const rowRe = /\((\d+), '((?:''|[^'])*)', '((?:''|[^'])*)', '((?:''|[^'])*)', '((?:''|[^'])*)', '([^']+)', (true|false)\)/g;

for (const m of sql.matchAll(rowRe)) {
  const slug = m[6];
  nlBySlug[slug] = {
    description: m[4].replace(/''/g, "'"),
    recognitionSentence: m[5].replace(/''/g, "'")
  };
}

const out = {};
for (let i = 0; i < slugs.length; i++) {
  const slug = slugs[i];
  const nl = nlBySlug[slug];
  if (!nl) {
    console.error("missing nl for", slug);
    continue;
  }
  out[slug] = {
    en: { description: descs[i], recognitionSentence: sents[i] },
    nl: { description: nl.description, recognitionSentence: nl.recognitionSentence }
  };
}

const target = path.join(root, "lib/card-content-translations.ts");
const body = `export type CardContentLocale = "en" | "nl";

export type CardContentLocaleFields = {
  description: string;
  recognitionSentence: string;
};

export const cardContentTranslations: Record<string, Record<CardContentLocale, CardContentLocaleFields>> = ${JSON.stringify(out, null, 2)} as Record<string, Record<CardContentLocale, CardContentLocaleFields>>;
`;

fs.writeFileSync(target, body);
console.log("written", Object.keys(out).length, "cards to", target);
