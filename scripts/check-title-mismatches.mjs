import fs from "fs";
const t = fs.readFileSync("lib/cards.ts", "utf8");
const titles = [...t.matchAll(/"title": "([^"]+)"/g)].map((m) => m[1]);
const slugs = [...t.matchAll(/"slug": "([^"]+)"/g)].map((m) => m[1]);
const trans = Object.fromEntries(
  [...t.matchAll(/([\w-]+): \{ en: "([^"]+)"/g)].map((m) => [m[1], m[2]])
);
titles.forEach((title, i) => {
  const slug = slugs[i];
  const en = trans[slug];
  if (en !== title) console.log(slug, title, "!=", en);
});
