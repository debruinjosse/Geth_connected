import { rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const targetPath = path.resolve(projectRoot, ".next");

if (!targetPath.startsWith(projectRoot)) {
  throw new Error(`Refusing to remove .next outside project root: ${targetPath}`);
}

try {
  await rm(targetPath, { recursive: true, force: true });
  console.log("Removed .next cache.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
