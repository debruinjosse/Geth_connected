import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const envPath = path.join(process.cwd(), ".env.local");

function stripBomFromBuffer(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3);
  }

  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return Buffer.from(buffer.subarray(2).toString("utf16le"), "utf16le");
  }

  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    return Buffer.from(buffer.subarray(2).toString("utf16le"), "utf16le");
  }

  return buffer;
}

export function getEnvLocalCandidatePaths(projectRoot = process.cwd()) {
  const candidates = [path.join(projectRoot, ".env.local"), path.join(projectRoot, ".env")];

  const workspaceNodeModules = path.join(projectRoot, "node_modules", "gethconnected-starter", ".env.local");
  const hoistedNodeModules = path.join(projectRoot, "..", "..", "node_modules", "gethconnected-starter", ".env.local");

  candidates.push(workspaceNodeModules, hoistedNodeModules);
  return candidates.filter((candidate, index, all) => all.indexOf(candidate) === index);
}

export async function stripEnvBomIfPresent(projectRoot = process.cwd()) {
  let changed = 0;

  for (const candidate of getEnvLocalCandidatePaths(projectRoot)) {
    if (!existsSync(candidate)) continue;

    const buffer = await readFile(candidate);
    const stripped = stripBomFromBuffer(buffer);

    if (stripped.length !== buffer.length) {
      await writeFile(candidate, stripped);
      changed += 1;
      console.warn(`Removed BOM from ${candidate}`);
    }
  }

  return changed;
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

export async function loadLocalEnv(projectRoot = process.cwd()) {
  const envFilePath = path.join(projectRoot, ".env.local");

  try {
    let envFile = await readFile(envFilePath, "utf8");
    if (envFile.charCodeAt(0) === 0xfeff) {
      envFile = envFile.slice(1);
    }

    for (const line of envFile.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed) continue;

      const [key, value] = parsed;
      process.env[key] ??= value;
    }
  } catch {
    // .env.local is optional when vars are already in the shell.
  }
}

export function inferProjectIdFromSupabaseUrl() {
  if (process.env.SUPABASE_PROJECT_ID || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;

  const match = process.env.NEXT_PUBLIC_SUPABASE_URL.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
  if (match?.[1]) {
    process.env.SUPABASE_PROJECT_ID = match[1];
  }
}
