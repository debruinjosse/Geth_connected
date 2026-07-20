import { spawn } from "node:child_process";
import process from "node:process";

const continueOnError = process.argv.includes("--continue-on-error");
const nodeCommand = process.execPath;

const child = spawn(nodeCommand, ["scripts/supabase-push.mjs"], {
  cwd: process.cwd(),
  stdio: "inherit"
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
    console.warn("Supabase migration push failed, but the requested command will continue.");
    process.exitCode = 0;
    return;
  }

  process.exitCode = code ?? 1;
});
