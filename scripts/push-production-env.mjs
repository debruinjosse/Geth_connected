/**
 * Sync SMTP (and related) env vars from .env.local to Vercel Production + Preview.
 *
 * Usage:
 *   npm run env:push-production
 *
 * Requires VERCEL_TOKEN (create at vercel.com/account/tokens) and either:
 *   VERCEL_PROJECT_ID  — from Vercel project Settings → General
 *   or VERCEL_PROJECT_NAME — e.g. geth-connected
 *
 * Never commit .env.local or tokens.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ENV_FILE = path.join(process.cwd(), ".env.local");

const SMTP_KEYS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "SMTP_REPLY_TO"
];

const RELATED_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GETH_INVOICE_SELLER_EMAIL",
  "GETH_INVOICE_SELLER_NAME",
  "GETH_CALENDAR_ATTENDEES"
];

const ALL_KEYS = [...SMTP_KEYS, ...RELATED_KEYS];

function loadEnvLocal() {
  if (!fs.existsSync(ENV_FILE)) {
    console.error("Missing .env.local — add SMTP settings first.");
    process.exit(1);
  }

  const lines = fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function printManualChecklist(values) {
  console.log("\n=== Manual Vercel setup (if auto-push is unavailable) ===\n");
  console.log("Vercel → Project → Settings → Environment Variables → Production + Preview:\n");
  for (const key of ALL_KEYS) {
    const value = values[key];
    if (!value) continue;
    const display = key.includes("PASS") ? "<from .env.local>" : value;
    console.log(`  ${key}=${display}`);
  }
  console.log("\nThen: Deployments → Redeploy latest (required for server actions to pick up SMTP).\n");
  console.log("=== Supabase Auth SMTP (magic links / signup — separate from app SMTP) ===\n");
  console.log("Supabase Dashboard → Project Settings → Authentication → SMTP Settings:\n");
  console.log(`  Host: ${values.SMTP_HOST ?? "smtp.transip.email"}`);
  console.log(`  Port: ${values.SMTP_PORT ?? "465"}`);
  console.log(`  User: ${values.SMTP_USER ?? "info@geth.pro"}`);
  console.log(`  Sender: ${values.SMTP_FROM ?? "GETH <info@geth.pro>"}`);
  console.log("\nUntil Supabase Auth SMTP uses info@geth.pro, auth emails may still come from an old sender.\n");
}

async function getProjectId(token, projectName) {
  const response = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(projectName)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Could not resolve project "${projectName}": ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.id;
}

async function upsertEnvVar(token, projectId, key, value, targets) {
  const listResponse = await fetch(
    `https://api.vercel.com/v9/projects/${projectId}/env?decrypt=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!listResponse.ok) {
    throw new Error(`Failed to list env vars: ${listResponse.status}`);
  }

  const existing = (await listResponse.json()).envs?.find((entry) => entry.key === key && entry.target?.some((t) => targets.includes(t)));

  if (existing) {
    const patchResponse = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env/${existing.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ value, target: targets })
    });

    if (!patchResponse.ok) {
      const text = await patchResponse.text();
      throw new Error(`Failed to update ${key}: ${patchResponse.status} ${text}`);
    }

    return "updated";
  }

  const createResponse = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      key,
      value,
      type: "encrypted",
      target: targets
    })
  });

  if (!createResponse.ok) {
    const text = await createResponse.text();
    throw new Error(`Failed to create ${key}: ${createResponse.status} ${text}`);
  }

  return "created";
}

async function main() {
  loadEnvLocal();

  const values = Object.fromEntries(ALL_KEYS.map((key) => [key, process.env[key]?.trim() ?? ""]));
  const missingSmtp = SMTP_KEYS.filter((key) => !values[key]);

  if (missingSmtp.length) {
    console.error(`Missing SMTP keys in .env.local: ${missingSmtp.join(", ")}`);
    process.exit(1);
  }

  if (values.NEXT_PUBLIC_APP_URL?.includes("ngrok") || values.NEXT_PUBLIC_APP_URL?.includes("localhost")) {
    console.warn("Warning: NEXT_PUBLIC_APP_URL is local/dev — using https://geth.pro for production push.");
    values.NEXT_PUBLIC_APP_URL = "https://geth.pro";
  }

  if (!/geth\.pro/i.test(values.SMTP_FROM) || !/geth\.pro/i.test(values.SMTP_USER)) {
    console.warn("Warning: SMTP_FROM and SMTP_USER should use info@geth.pro for production.");
  }

  const token = process.env.VERCEL_TOKEN?.trim();
  const projectId = process.env.VERCEL_PROJECT_ID?.trim();
  const projectName = process.env.VERCEL_PROJECT_NAME?.trim() ?? "geth-connected";

  if (!token) {
    console.log("VERCEL_TOKEN not set — showing manual checklist only.");
    printManualChecklist(values);
    process.exit(0);
  }

  let resolvedProjectId = projectId;
  if (!resolvedProjectId) {
    console.log(`Resolving Vercel project "${projectName}"…`);
    resolvedProjectId = await getProjectId(token, projectName);
  }

  const targets = ["production", "preview"];
  const results = [];

  for (const key of ALL_KEYS) {
    const value = values[key];
    if (!value) continue;
    const action = await upsertEnvVar(token, resolvedProjectId, key, value, targets);
    results.push(`${action} ${key}`);
  }

  console.log("Vercel env sync complete:\n");
  results.forEach((line) => console.log(`  ✓ ${line}`));
  console.log("\nRedeploy on Vercel so server actions use the new SMTP settings.");
  printManualChecklist(values);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
