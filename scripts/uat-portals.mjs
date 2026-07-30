/**
 * UAT smoke test: portal routes + SMTP connectivity.
 * Usage: node scripts/uat-portals.mjs [--base http://localhost:3000] [--send-test-email]
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import nodemailer from "nodemailer";

const args = process.argv.slice(2);
const baseUrl = args.find((arg) => arg.startsWith("--base="))?.slice(7) ?? "http://localhost:3000";
const sendTestEmail = args.includes("--send-test-email");

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
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
    if (!process.env[key]) process.env[key] = value;
  }
}

const locale = "en";
const routes = [
  { group: "Public", path: `/${locale}` },
  { group: "Public", path: `/${locale}/pricing` },
  { group: "Public", path: `/${locale}/login` },
  { group: "Public", path: `/${locale}/book-demo` },
  { group: "Employee", path: `/${locale}/employee` },
  { group: "Employee", path: `/${locale}/employee/scan` },
  { group: "Employee", path: `/${locale}/employee/messages` },
  { group: "Manager", path: `/${locale}/manager` },
  { group: "Manager", path: `/${locale}/manager/analytics` },
  { group: "Company", path: `/${locale}/company` },
  { group: "Company", path: `/${locale}/company/billing` },
  { group: "Admin", path: `/${locale}/admin` },
  { group: "Admin", path: `/${locale}/admin/subscriptions` },
  { group: "Admin", path: `/${locale}/admin/analytics` }
];

const emailFlows = [
  { flow: "Magic link (login/signup)", transport: "App SMTP (nodemailer)", fn: "sendMagicLinkEmail" },
  { flow: "Company/manager invites", transport: "App SMTP", fn: "sendInviteEmail" },
  { flow: "Invoice generated", transport: "App SMTP + PDF", fn: "sendInvoiceEmail" },
  { flow: "Demo booking request", transport: "App SMTP", fn: "sendDemoBookingRequestEmails" },
  { flow: "Demo booking decision", transport: "App SMTP + ICS", fn: "sendDemoBookingDecisionEmail" },
  { flow: "Calendar invite", transport: "App SMTP", fn: "sendCalendarInviteEmail" },
  { flow: "Password reset", transport: "Supabase Auth SMTP", fn: "supabase.auth.resetPasswordForEmail" },
  { flow: "Recognition card received", transport: "App SMTP", fn: "sendRecognitionReceivedEmail" },
  { flow: "Platform notifications", transport: "In-app only", fn: "notifications table" }
];

async function checkRoute(route) {
  const url = `${baseUrl}${route.path}`;
  try {
    const response = await fetch(url, { redirect: "manual" });
    const ok = response.status < 500;
    return { ...route, url, status: response.status, ok };
  } catch (error) {
    return {
      ...route,
      url,
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function checkSmtp() {
  const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "SMTP_REPLY_TO"];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) {
    return { ok: false, message: `Missing: ${missing.join(", ")}` };
  }

  const port = Number(process.env.SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  await transporter.verify();

  if (sendTestEmail) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      replyTo: process.env.SMTP_REPLY_TO,
      to: process.env.SMTP_REPLY_TO || process.env.SMTP_FROM,
      subject: "GETH UAT SMTP test",
      text: "Automated UAT test from scripts/uat-portals.mjs"
    });
    return { ok: true, message: "SMTP verified and test email sent." };
  }

  return { ok: true, message: "SMTP verified (no test email sent)." };
}

async function main() {
  loadEnvLocal();
  console.log(`\nGETH UAT — base URL: ${baseUrl}\n`);

  console.log("=== Portal route checks ===");
  const results = await Promise.all(routes.map(checkRoute));
  let routeFailures = 0;
  for (const result of results) {
    const mark = result.ok ? "OK" : "FAIL";
    const detail = result.error ? ` (${result.error})` : "";
    console.log(`[${mark}] ${result.group.padEnd(9)} ${result.status} ${result.path}${detail}`);
    if (!result.ok) routeFailures += 1;
  }

  console.log("\n=== Email flow matrix ===");
  for (const item of emailFlows) {
    console.log(`- ${item.flow}: ${item.transport} [${item.fn}]`);
  }

  console.log("\n=== SMTP connectivity ===");
  try {
    const smtp = await checkSmtp();
    console.log(`[OK] ${smtp.message}`);
  } catch (error) {
    console.log(`[FAIL] ${error instanceof Error ? error.message : String(error)}`);
    routeFailures += 1;
  }

  console.log("\n=== Summary ===");
  if (routeFailures === 0) {
    console.log("All automated checks passed.");
  } else {
    console.log(`${routeFailures} check(s) failed. Review logs above.`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
