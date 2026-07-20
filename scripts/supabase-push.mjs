import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, ".env.local");

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
    // .env.local is optional. Required values can also come from the shell/CI.
  }
}

function inferProjectIdFromSupabaseUrl() {
  if (process.env.SUPABASE_PROJECT_ID || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;

  const match = process.env.NEXT_PUBLIC_SUPABASE_URL.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
  if (match?.[1]) {
    process.env.SUPABASE_PROJECT_ID = match[1];
  }
}

function getNpxCommand() {
  return process.platform === "win32" ? "npx.cmd" : "npx";
}

function safeArgs(args) {
  return args.map((arg, index) => {
    const previous = args[index - 1];
    return ["--password", "--access-token", "--token"].includes(previous) ? "***" : arg;
  });
}

function runSupabase(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(getNpxCommand(), ["supabase", ...args], {
      cwd: projectRoot,
      env: {
        ...process.env,
        SUPABASE_TELEMETRY_DISABLED: "1"
      },
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Supabase CLI failed with exit code ${code}: npx supabase ${safeArgs(args).join(" ")}`));
    });
  });
}

async function main() {
  await loadLocalEnv();
  inferProjectIdFromSupabaseUrl();

  if (!process.env.SUPABASE_PROJECT_ID) {
    throw new Error("SUPABASE_PROJECT_ID is missing.");
  }

  if (!process.env.SUPABASE_DB_PASSWORD) {
    throw new Error("SUPABASE_DB_PASSWORD is missing.");
  }

  if (!process.env.SUPABASE_ACCESS_TOKEN) {
    console.warn("SUPABASE_ACCESS_TOKEN is missing. This is okay only if the Supabase CLI is already logged in.");
  }

  await runSupabase(["link", "--project-ref", process.env.SUPABASE_PROJECT_ID, "--password", process.env.SUPABASE_DB_PASSWORD]);
  await runSupabase(["db", "push", "--yes"]);
  console.log("Supabase migrations pushed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
