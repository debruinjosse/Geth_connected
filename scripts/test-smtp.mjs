import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import nodemailer from "nodemailer";

const requiredVariables = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "SMTP_REPLY_TO"];

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

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function getSmtpConfig() {
  const missing = requiredVariables.filter((key) => !process.env[key]?.trim());
  if (missing.length) {
    throw new Error(`Missing SMTP variables: ${missing.join(", ")}`);
  }

  const port = Number(process.env.SMTP_PORT || 465);
  return {
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    from: process.env.SMTP_FROM,
    replyTo: process.env.SMTP_REPLY_TO
  };
}

async function main() {
  loadEnvLocal();

  const config = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth
  });

  await transporter.verify();
  console.log(`TransIP SMTP connection verified. secure=${config.secure}, host=${config.host}, port=${config.port}, user=${config.auth.user}`);

  if (process.argv.includes("--send")) {
    await transporter.sendMail({
      from: config.from,
      replyTo: config.replyTo,
      to: "info@geth.pro",
      subject: "GETH SMTP test",
      text: "TransIP SMTP test email from the GETH app configuration."
    });
    console.log("Test email sent to info@geth.pro.");
  } else {
    console.log("No test email sent. Run `npm run test:smtp -- --send` to send one.");
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`SMTP test failed: ${message}`);
  process.exit(1);
});
