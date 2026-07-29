import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const messagesDir = path.join(projectRoot, "messages");
const envPath = path.join(projectRoot, ".env.local");
const brandTerms = ["GETH Connected Cards", "GETH", "Supabase", "QR", "CSV"];
const preservedSymbols = ["©"];
const localeRegistry = {
  nl: { label: "Dutch", file: "nl.json" }
};
const defaultLocales = ["nl"];

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    mode: "full",
    locales: defaultLocales
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--missing") {
      options.mode = "missing";
    } else if (arg === "--full") {
      options.mode = "full";
    } else if (arg === "--mode") {
      options.mode = args[index + 1] === "missing" ? "missing" : "full";
      index += 1;
    } else if (arg.startsWith("--mode=")) {
      options.mode = arg.split("=")[1] === "missing" ? "missing" : "full";
    } else if (arg === "--locales") {
      options.locales = parseLocaleList(args[index + 1]);
      index += 1;
    } else if (arg.startsWith("--locales=")) {
      options.locales = parseLocaleList(arg.split("=")[1]);
    }
  }

  return options;
}

function parseLocaleList(value = "") {
  const locales = value
    .split(",")
    .map((locale) => locale.trim())
    .filter(Boolean);

  return locales.length ? locales : defaultLocales;
}

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return null;

  const separatorIndex = trimmed.indexOf("=");
  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  return [key, value];
}

async function loadLocalEnv() {
  try {
    const envFile = await readFile(envPath, "utf8");
    for (const line of envFile.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed) continue;

      const [key, value] = parsed;
      process.env[key] ??= value;
    }
  } catch {
    // .env.local is optional, but GROQ_API_KEY must be available somewhere.
  }
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (fallback !== null && error?.code === "ENOENT") return fallback;
    throw error;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function flattenMessages(value, prefix = "") {
  const result = new Map();

  for (const [key, childValue] of Object.entries(value)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(childValue)) {
      for (const [nestedKey, nestedValue] of flattenMessages(childValue, nextKey)) {
        result.set(nestedKey, nestedValue);
      }
    } else if (typeof childValue === "string") {
      result.set(nextKey, childValue);
    }
  }

  return result;
}

function getByPath(source, keyPath) {
  return keyPath.split(".").reduce((current, part) => {
    if (!isPlainObject(current) && typeof current !== "object") return undefined;
    return current?.[part];
  }, source);
}

function setByPath(target, keyPath, value) {
  const parts = keyPath.split(".");
  let current = target;

  for (const part of parts.slice(0, -1)) {
    if (!isPlainObject(current[part])) {
      current[part] = {};
    }

    current = current[part];
  }

  current[parts.at(-1)] = value;
}

function collectMessagesForMode(englishMessages, targetMessages, mode) {
  const englishFlat = flattenMessages(englishMessages);
  const selected = [];

  for (const [key, englishValue] of englishFlat) {
    const targetValue = getByPath(targetMessages, key);

    if (mode === "full" || typeof targetValue !== "string" || targetValue.trim() === "") {
      selected.push({ key, value: englishValue });
    }
  }

  return selected;
}

function extractPlaceholders(value) {
  return [...value.matchAll(/\{[^{}]+\}/g)].map((match) => match[0]);
}

function validateTranslation({ key, source, translated }) {
  for (const placeholder of extractPlaceholders(source)) {
    if (!translated.includes(placeholder)) {
      throw new Error(`Translation for "${key}" is missing placeholder ${placeholder}.`);
    }
  }

  for (const term of brandTerms) {
    if (source.includes(term) && !translated.includes(term)) {
      throw new Error(`Translation for "${key}" changed required brand term ${term}.`);
    }
  }

  for (const symbol of preservedSymbols) {
    if (source.includes(symbol) && !translated.includes(symbol)) {
      throw new Error(`Translation for "${key}" is missing preserved symbol ${symbol}.`);
    }
  }
}

function restoreProtectedText({ key, source, translated }) {
  if (key.endsWith(".copyright")) {
    return source;
  }

  if (source === "GETH Connected Cards") {
    return source;
  }

  let restored = translated;

  for (const symbol of preservedSymbols) {
    if (source.includes(symbol) && !restored.includes(symbol)) {
      restored = `${symbol} ${restored}`;
    }
  }

  return restored;
}

function parseGroqJson(content) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Groq response did not contain JSON.");
    return JSON.parse(match[0]);
  }
}

function chunkMessages(messages, chunkSize = 45) {
  const chunks = [];

  for (let index = 0; index < messages.length; index += chunkSize) {
    chunks.push(messages.slice(index, index + chunkSize));
  }

  return chunks;
}

async function translateChunk({ apiKey, localeLabel, messages }) {
  if (messages.length === 0) return {};

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            `You translate product UI copy from English to ${localeLabel}.`,
            "Return only valid JSON in the shape {\"translations\":{\"key\":\"translated value\"}}.",
            "Translate every provided value and keep every provided key unchanged.",
            "Preserve ICU placeholders exactly, including braces, such as {name}, {count}, {role}.",
            `Preserve these brand/product terms exactly: ${brandTerms.join(", ")}.`,
            `Preserve these symbols exactly when they appear: ${preservedSymbols.join(", ")}.`,
            "Keep tone concise, clear, warm, and natural for a SaaS dashboard."
          ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            translations: Object.fromEntries(messages.map((item) => [item.key, item.value]))
          })
        }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq response was empty.");

  const parsed = parseGroqJson(content);
  return parsed.translations ?? parsed;
}

async function translateMessages({ apiKey, localeLabel, messages }) {
  const translations = {};

  for (const chunk of chunkMessages(messages)) {
    const translatedChunk = await translateChunk({ apiKey, localeLabel, messages: chunk });
    Object.assign(translations, translatedChunk);
  }

  return translations;
}

async function main() {
  await loadLocalEnv();

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY is missing. Add GROQ_API_KEY=... to .env.local, then run npm run translate:messages.");
    process.exitCode = 1;
    return;
  }

  const options = parseArgs();
  const englishMessages = await readJson(path.join(messagesDir, "en.json"));
  let totalTranslated = 0;

  for (const localeCode of options.locales) {
    const locale = localeRegistry[localeCode];
    if (!locale) {
      throw new Error(`Unsupported locale "${localeCode}". Supported locales: ${Object.keys(localeRegistry).join(", ")}.`);
    }

    const targetPath = path.join(messagesDir, locale.file);
    const targetMessages = options.mode === "full" ? {} : await readJson(targetPath, {});
    const selected = collectMessagesForMode(englishMessages, targetMessages, options.mode);

    if (selected.length === 0) {
      console.log(`${localeCode}: 0 ${options.mode === "full" ? "source" : "missing"} keys.`);
      continue;
    }

    console.log(`${localeCode}: translating ${selected.length} key(s) to ${locale.label} (${options.mode} mode)...`);
    const translations = await translateMessages({
      apiKey,
      localeLabel: locale.label,
      messages: selected
    });

    for (const item of selected) {
      const translated = translations[item.key];
      if (typeof translated !== "string" || translated.trim() === "") {
        throw new Error(`Groq did not return a translation for "${item.key}".`);
      }

      const restored = restoreProtectedText({ key: item.key, source: item.value, translated });
      validateTranslation({ key: item.key, source: item.value, translated: restored });
      setByPath(targetMessages, item.key, restored);
      totalTranslated += 1;
    }

    await writeFile(targetPath, `${JSON.stringify(targetMessages, null, 2)}\n`, "utf8");
    console.log(`${localeCode}: wrote ${selected.length} translated key(s).`);
  }

  console.log(`Done. Translated ${totalTranslated} total key(s).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
