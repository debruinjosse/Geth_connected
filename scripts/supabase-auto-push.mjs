import { spawn } from "node:child_process";
import process from "node:process";

const continueOnError = process.argv.includes("--continue-on-error");
const nodeCommand = process.execPath;
const args = ["scripts/db-migrate.mjs"];
if (continueOnError) {
  args.push("--soft");
}

const child = spawn(nodeCommand, args, {
  cwd: process.cwd(),
  stdio: "inherit",
  shell: false
});

child.on("error", (error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = continueOnError ? 0 : 1;
});

child.on("close", (code) => {
  if (code === 0) {
    process.exitCode = 0;
    return;
  }

  if (continueOnError) {
    console.warn("Database migration failed, but the requested command will continue.");
    process.exitCode = 0;
    return;
  }

  process.exitCode = code ?? 1;
});
