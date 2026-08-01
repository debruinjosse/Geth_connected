/**
 * Push SMTP settings from .env.local to Supabase Auth (magic links, password reset).
 *
 * Usage: npm run env:push-supabase-auth
 *
 * Requires SUPABASE_ACCESS_TOKEN (Administrator or Owner) and SMTP_* in .env.local.
 */
import process from "node:process";
import { loadLocalEnv, stripEnvBomIfPresent, inferProjectIdFromSupabaseUrl } from "./lib/env-local.mjs";

function parseSmtpFrom(value) {
  const trimmed = String(value ?? "").trim();
  const match = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }

  return { name: "GETH", email: trimmed || "info@geth.pro" };
}

function resolveProductionAppUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || "";
  if (!raw || /localhost|127\.0\.0\.1|ngrok/i.test(raw)) {
    return "https://geth.pro";
  }

  return raw;
}

async function main() {
  await stripEnvBomIfPresent();
  await loadLocalEnv();
  inferProjectIdFromSupabaseUrl();

  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  const projectRef = process.env.SUPABASE_PROJECT_ID?.trim();

  if (!token) {
    throw new Error("SUPABASE_ACCESS_TOKEN is missing in .env.local.");
  }

  if (!projectRef) {
    throw new Error("SUPABASE_PROJECT_ID is missing in .env.local.");
  }

  const missing = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"].filter((key) => !process.env[key]?.trim());
  if (missing.length) {
    throw new Error(`Missing SMTP keys in .env.local: ${missing.join(", ")}`);
  }

  const { name, email } = parseSmtpFrom(process.env.SMTP_FROM);
  const port = Number(process.env.SMTP_PORT);
  const siteUrl = resolveProductionAppUrl();

  const body = {
    external_email_enabled: true,
    smtp_host: process.env.SMTP_HOST.trim(),
    smtp_port: String(port),
    smtp_user: process.env.SMTP_USER.trim(),
    smtp_pass: process.env.SMTP_PASS,
    smtp_admin_email: email,
    smtp_sender_name: name,
    site_url: siteUrl,
    uri_allow_list: `${siteUrl}/auth/verify,${siteUrl}/auth/verify/**,${siteUrl}/auth/callback,${siteUrl}/auth/callback/**,${siteUrl}/**`
  };

  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase Auth SMTP update failed (${response.status}): ${text}`);
  }

  console.log("Supabase Auth SMTP updated from .env.local:");
  console.log(`  Host: ${body.smtp_host}`);
  console.log(`  Port: ${body.smtp_port}`);
  console.log(`  User: ${body.smtp_user}`);
  console.log(`  Sender: ${name} <${email}>`);
  console.log(`  Site URL: ${body.site_url}`);
  console.log(`  Redirect URLs: ${body.uri_allow_list}`);
  console.log("\nAuth emails now use info@geth.pro and redirect to geth.pro (not ngrok).");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
