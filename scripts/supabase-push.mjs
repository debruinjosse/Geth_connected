import { spawn } from "node:child_process";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  getEnvLocalCandidatePaths,
  inferProjectIdFromSupabaseUrl,
  loadLocalEnv,
  stripEnvBomIfPresent
} from "./lib/env-local.mjs";

const projectRoot = process.cwd();
const supabaseCli = path.join(projectRoot, "node_modules", "supabase", "dist", "supabase.js");

function safeArgs(args) {
  return args.map((arg, index) => {
    const previous = args[index - 1];
    return ["--password", "--access-token", "--token"].includes(previous) ? "***" : arg;
  });
}

function runSupabase(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [supabaseCli, ...args], {
      cwd: projectRoot,
      env: {
        ...process.env,
        SUPABASE_TELEMETRY_DISABLED: "1"
      },
      shell: false,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Supabase CLI failed with exit code ${code}: node supabase ${safeArgs(args).join(" ")}`));
    });
  });
}

async function quarantineEnvFilesForSupabaseCli() {
  const backups = [];

  for (const candidate of getEnvLocalCandidatePaths(projectRoot)) {
    if (!existsSync(candidate)) continue;

    const backupPath = `${candidate}.supabase-cli-bak`;
    const buffer = await readFile(candidate);
    await writeFile(backupPath, buffer);
    await unlink(candidate);
    backups.push({ original: candidate, backup: backupPath });
  }

  return async () => {
    for (const entry of backups) {
      if (!existsSync(entry.backup)) continue;
      const buffer = await readFile(entry.backup);
      await writeFile(entry.original, buffer);
      await unlink(entry.backup);
    }
  };
}

async function main() {
  await stripEnvBomIfPresent(projectRoot);
  await loadLocalEnv(projectRoot);
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

  const restoreEnvFiles = await quarantineEnvFilesForSupabaseCli();

  try {
    await runSupabase(["link", "--project-ref", process.env.SUPABASE_PROJECT_ID, "--password", process.env.SUPABASE_DB_PASSWORD]);
    await runSupabase(["db", "push", "--yes"]);
    console.log("Supabase migrations pushed via CLI.");
  } finally {
    await restoreEnvFiles();
  }
}

const isDirectEntry = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectEntry) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

export { main as pushWithSupabaseCli };
