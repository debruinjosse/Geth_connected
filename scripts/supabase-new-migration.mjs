import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const migrationsDir = path.join(projectRoot, "supabase", "migrations");
const requestedName = process.argv[2] ?? "auto_change";

function sanitizeName(value) {
  const safeName = value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return safeName || "auto_change";
}

function nextMigrationNumber(files) {
  const numbers = files
    .map((file) => Number(file.match(/^(\d+)/)?.[1] ?? 0))
    .filter((number) => Number.isInteger(number) && number > 0);

  return numbers.length ? Math.max(...numbers) + 1 : 1;
}

await mkdir(migrationsDir, { recursive: true });

const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql"));
const migrationNumber = String(nextMigrationNumber(files)).padStart(3, "0");
const migrationFileName = `${migrationNumber}_${sanitizeName(requestedName)}.sql`;
const migrationPath = path.join(migrationsDir, migrationFileName);
const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);

const template = `-- Migration: ${migrationFileName}
-- Created automatically: ${timestamp}
-- Add schema changes below. Keep prior migration files unchanged.

begin;

-- SQL goes here

commit;
`;

await writeFile(migrationPath, template, "utf8");
console.log(migrationPath);
