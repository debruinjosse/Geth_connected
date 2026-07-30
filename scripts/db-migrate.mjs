/**
 * Unified migration runner: Supabase CLI first, direct DATABASE_URL fallback on Windows/CLI issues.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = process.cwd();
const continueOnError = process.argv.includes("--soft");

async function runDirectMigrate() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/db-migrate-direct.mjs"], {
      cwd: projectRoot,
      stdio: "inherit",
      shell: false
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Direct migration failed with exit code ${code ?? 1}`));
    });
  });
}

async function runCliMigrate() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/supabase-push.mjs"], {
      cwd: projectRoot,
      stdio: "inherit",
      shell: false
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Supabase CLI migration failed with exit code ${code ?? 1}`));
    });
  });
}

async function main() {
  try {
    await runCliMigrate();
    return;
  } catch (cliError) {
    console.warn(cliError instanceof Error ? cliError.message : cliError);
    console.warn("Falling back to direct DATABASE_URL migration…");
  }

  try {
    await runDirectMigrate();
  } catch (directError) {
    if (continueOnError) {
      console.warn(directError instanceof Error ? directError.message : directError);
      console.warn("Migration push failed, but --soft was set so the command will continue.");
      return;
    }
    throw directError;
  }
}

const isDirectEntry = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectEntry) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = continueOnError ? 0 : 1;
  });
}
