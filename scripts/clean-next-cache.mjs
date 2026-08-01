import { rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const targetPath = path.resolve(projectRoot, ".next");

if (!targetPath.startsWith(projectRoot)) {
  throw new Error(`Refusing to remove .next outside project root: ${targetPath}`);
}

async function removeNextCache() {
  await rm(targetPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
}

try {
  await removeNextCache();
  console.log("Removed .next cache.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  console.error("If npm run dev is still running, stop it and run npm run clean again.");
  process.exitCode = 1;
}
