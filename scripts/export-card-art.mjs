/**
 * Exports the 53 GETH card artworks (source PNGs in /cards, git-ignored) as web-sized WebP
 * into /public/cards/<locale>/card_NN_content.webp and card_NN_cover.webp.
 * Usage: node scripts/export-card-art.mjs
 */
import { mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const locales = ["nl", "en"];
const kinds = ["content", "cover"];
let written = 0;

for (const locale of locales) {
  const outDir = resolve(ROOT, "public", "cards", locale);
  mkdirSync(outDir, { recursive: true });

  for (let number = 1; number <= 53; number += 1) {
    const id = String(number).padStart(2, "0");
    for (const kind of kinds) {
      const source = resolve(ROOT, "cards", locale, `card_${id}_${kind}.png`);
      if (!existsSync(source)) {
        console.warn(`missing ${source}`);
        continue;
      }
      await sharp(source).webp({ quality: 84, effort: 5 }).toFile(resolve(outDir, `card_${id}_${kind}.webp`));
      written += 1;
    }
  }
}

console.log(`Wrote ${written} WebP files to public/cards`);
