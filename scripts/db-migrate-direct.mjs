/**
 * Applies pending SQL migrations directly via DATABASE_URL (no Supabase CLI).
 * Tracks versions in supabase_migrations.schema_migrations like the CLI.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";
import { loadLocalEnv, inferProjectIdFromSupabaseUrl } from "./lib/env-local.mjs";

const projectRoot = process.cwd();
const migrationsDir = path.join(projectRoot, "supabase", "migrations");

function parseMigrationFile(fileName) {
  const match = fileName.match(/^(\d+)_(.+)\.sql$/);
  if (!match) {
    throw new Error(`Unexpected migration filename: ${fileName}`);
  }

  return {
    fileName,
    version: match[1],
    name: match[2]
  };
}

async function ensureMigrationTable(client) {
  await client.query("create schema if not exists supabase_migrations");
  await client.query(`
    create table if not exists supabase_migrations.schema_migrations (
      version text primary key,
      statements text[],
      name text
    )
  `);
}

async function getAppliedVersions(client) {
  const result = await client.query("select version from supabase_migrations.schema_migrations");
  return new Set(result.rows.map((row) => row.version));
}

async function main() {
  await loadLocalEnv();
  inferProjectIdFromSupabaseUrl();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing from .env.local");
  }

  const files = (await readdir(migrationsDir))
    .filter((name) => name.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    await ensureMigrationTable(client);
    const applied = await getAppliedVersions(client);
    const pending = files
      .map(parseMigrationFile)
      .filter((migration) => !applied.has(migration.version));

    if (!pending.length) {
      console.log("Database migrations: already up to date.");
      return;
    }

    console.log(`Applying ${pending.length} migration(s) via DATABASE_URL…`);

    for (const migration of pending) {
      const sql = await readFile(path.join(migrationsDir, migration.fileName), "utf8");
      console.log(`→ ${migration.fileName}`);

      await client.query("begin");
      try {
        await client.query(sql);
        await client.query(
          "insert into supabase_migrations.schema_migrations (version, statements, name) values ($1, $2, $3)",
          [migration.version, [sql], migration.name]
        );
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
    }

    console.log("Database migrations applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
