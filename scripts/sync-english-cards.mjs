import { inflateRawSync } from "node:zlib";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const REQUIRED_COLUMNS = ["Card number", "Name", "Category", "Quality", "Recognition sentence"];
const CARD_COUNT = 53;
const MIGRATION_PATH = path.join("supabase", "migrations", "015_sync_english_card_library.sql");
const CARDS_PATH = path.join("lib", "cards.ts");

function fail(message) {
  console.error(`Card sync failed: ${message}`);
  process.exit(1);
}

function readUInt16(buffer, offset) {
  return buffer.readUInt16LE(offset);
}

function readUInt32(buffer, offset) {
  return buffer.readUInt32LE(offset);
}

function extractZipEntries(zipPath) {
  const buffer = readFileSync(zipPath);
  const minEndOfCentralDirectorySize = 22;
  let eocdOffset = -1;

  for (let index = buffer.length - minEndOfCentralDirectorySize; index >= 0; index -= 1) {
    if (readUInt32(buffer, index) === 0x06054b50) {
      eocdOffset = index;
      break;
    }
  }

  if (eocdOffset === -1) {
    fail("Could not find the XLSX zip directory.");
  }

  const entryCount = readUInt16(buffer, eocdOffset + 10);
  const centralDirectoryOffset = readUInt32(buffer, eocdOffset + 16);
  const entries = new Map();
  let cursor = centralDirectoryOffset;

  for (let entryIndex = 0; entryIndex < entryCount; entryIndex += 1) {
    if (readUInt32(buffer, cursor) !== 0x02014b50) {
      fail("Invalid XLSX central directory.");
    }

    const method = readUInt16(buffer, cursor + 10);
    const compressedSize = readUInt32(buffer, cursor + 20);
    const fileNameLength = readUInt16(buffer, cursor + 28);
    const extraLength = readUInt16(buffer, cursor + 30);
    const commentLength = readUInt16(buffer, cursor + 32);
    const localHeaderOffset = readUInt32(buffer, cursor + 42);
    const fileName = buffer.subarray(cursor + 46, cursor + 46 + fileNameLength).toString("utf8");

    if (readUInt32(buffer, localHeaderOffset) !== 0x04034b50) {
      fail(`Invalid XLSX local header for ${fileName}.`);
    }

    const localFileNameLength = readUInt16(buffer, localHeaderOffset + 26);
    const localExtraLength = readUInt16(buffer, localHeaderOffset + 28);
    const dataOffset = localHeaderOffset + 30 + localFileNameLength + localExtraLength;
    const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
    const content = method === 8 ? inflateRawSync(compressed) : compressed;
    entries.set(fileName, content.toString("utf8"));

    cursor += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function getSharedStrings(xml) {
  return Array.from(xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g), (match) => {
    const textParts = Array.from(match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g), (textMatch) => decodeXml(textMatch[1]));
    return textParts.join("");
  });
}

function getColumnName(cellRef) {
  return cellRef.replace(/\d+/g, "");
}

function getRows(sheetXml, sharedStrings) {
  return Array.from(sheetXml.matchAll(/<row\b[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g), (rowMatch) => {
    const row = {};
    for (const cellMatch of rowMatch[2].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1];
      const cellRef = attrs.match(/\br="([^"]+)"/)?.[1];
      if (!cellRef) continue;

      const valueMatch = cellMatch[2].match(/<v>([\s\S]*?)<\/v>/);
      const inlineMatch = cellMatch[2].match(/<t\b[^>]*>([\s\S]*?)<\/t>/);
      const rawValue = valueMatch?.[1] ?? inlineMatch?.[1] ?? "";
      const value = attrs.includes('t="s"') ? sharedStrings[Number(rawValue)] : decodeXml(rawValue);
      row[getColumnName(cellRef)] = value.trim();
    }
    return row;
  });
}

function normalizeCardNumber(value) {
  const match = String(value).match(/(\d+)/);
  return match ? Number(match[1]) : NaN;
}

function parseWorkbook(xlsxPath) {
  if (!existsSync(xlsxPath)) {
    fail(`Workbook not found at ${xlsxPath}. Pass the file path as the first argument.`);
  }

  const entries = extractZipEntries(xlsxPath);
  const sheetXml = entries.get("xl/worksheets/sheet1.xml");
  const sharedStringsXml = entries.get("xl/sharedStrings.xml");
  if (!sheetXml || !sharedStringsXml) {
    fail("Workbook must contain xl/worksheets/sheet1.xml and xl/sharedStrings.xml.");
  }

  const sharedStrings = getSharedStrings(sharedStringsXml);
  const rows = getRows(sheetXml, sharedStrings);
  const headers = REQUIRED_COLUMNS.reduce((acc, expected, index) => {
    const column = String.fromCharCode("A".charCodeAt(0) + index);
    const actual = rows[0]?.[column];
    if (actual !== expected) {
      fail(`Expected column ${column} to be "${expected}", found "${actual ?? "blank"}".`);
    }
    acc[column] = expected;
    return acc;
  }, {});

  if (Object.keys(headers).length !== REQUIRED_COLUMNS.length) {
    fail("Missing required columns.");
  }

  const cards = rows.slice(1).map((row) => ({
    cardNumber: normalizeCardNumber(row.A),
    title: row.B,
    category: row.C,
    description: row.D,
    recognitionSentence: row.E
  }));

  if (cards.length !== CARD_COUNT) {
    fail(`Expected ${CARD_COUNT} cards, found ${cards.length}.`);
  }

  const seen = new Set();
  for (const card of cards) {
    if (!Number.isInteger(card.cardNumber) || card.cardNumber < 1 || card.cardNumber > CARD_COUNT) {
      fail(`Invalid card number "${card.cardNumber}".`);
    }
    if (seen.has(card.cardNumber)) {
      fail(`Duplicate card number ${card.cardNumber}.`);
    }
    seen.add(card.cardNumber);

    for (const field of ["title", "category", "description", "recognitionSentence"]) {
      if (!card[field]) {
        fail(`Card ${card.cardNumber} is missing ${field}.`);
      }
    }
  }

  return cards.sort((a, b) => a.cardNumber - b.cardNumber);
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function generateMigration(cards) {
  const values = cards
    .map(
      (card) =>
        `  (${card.cardNumber}, ${sqlString(card.title)}, ${sqlString(card.category)}, ${sqlString(card.description)}, ${sqlString(card.recognitionSentence)})`
    )
    .join(",\n");

  return `-- Synchronizes official English GETH card text from GETH_cards_full_English.xlsx.
-- Safe by design: updates card text by card_number only and preserves id, qr_slug, active, and recognition references.

do $$
begin
  if (
    select count(*)
    from public.card_library
    where card_number between 1 and ${CARD_COUNT}
  ) <> ${CARD_COUNT} then
    raise exception 'Expected ${CARD_COUNT} existing card_library rows before syncing English card content.';
  end if;
end $$;

with official_cards(card_number, title, category, description, recognition_sentence) as (
values
${values}
)
update public.card_library as card
set
  title = official_cards.title,
  category = official_cards.category,
  description = official_cards.description,
  recognition_sentence = official_cards.recognition_sentence,
  updated_at = now()
from official_cards
where card.card_number = official_cards.card_number;

do $$
begin
  if exists (
    select 1
    from public.recognition_events event
    left join public.card_library card on card.id = event.card_id
    where card.id is null
  ) then
    raise exception 'Card sync validation failed: recognition_events contains an invalid card_id reference.';
  end if;
end $$;
`;
}

function extractCurrentRawCards(cardsFile) {
  const source = readFileSync(cardsFile, "utf8");
  const match = source.match(/const rawCards: GethCard\[\] = (\[[\s\S]*?\]);\n\nconst encodingFixes/);
  if (!match) {
    fail("Could not locate rawCards in lib/cards.ts.");
  }

  return {
    source,
    cards: JSON.parse(match[1])
  };
}

function generateRawCards(officialCards, currentCards) {
  const byNumber = new Map(currentCards.map((card) => [card.cardNumber, card]));
  return officialCards.map((official) => {
    const current = byNumber.get(official.cardNumber);
    if (!current) {
      fail(`Local fallback is missing card ${official.cardNumber}.`);
    }
    return {
      id: current.id,
      cardNumber: official.cardNumber,
      title: official.title,
      category: official.category,
      description: official.description,
      recognitionSentence: official.recognitionSentence,
      slug: current.slug,
      active: current.active
    };
  });
}

function updateCardsFile(officialCards) {
  const { source, cards: currentCards } = extractCurrentRawCards(CARDS_PATH);
  const rawCards = generateRawCards(officialCards, currentCards);
  const generatedArray = JSON.stringify(rawCards, null, 2);
  const nextSource = source.replace(/const rawCards: GethCard\[\] = \[[\s\S]*?\];\n\nconst encodingFixes/, `const rawCards: GethCard[] = ${generatedArray};\n\nconst encodingFixes`);
  writeFileSync(CARDS_PATH, nextSource);
}

const inputPath = process.argv[2] ?? process.env.GETH_CARDS_XLSX ?? "GETH_cards_full_English.xlsx";
const cards = parseWorkbook(inputPath);

writeFileSync(MIGRATION_PATH, generateMigration(cards));
updateCardsFile(cards);

console.log(`Synchronized ${cards.length} English cards.`);
console.log(`Wrote ${MIGRATION_PATH}`);
console.log(`Updated ${CARDS_PATH}`);
