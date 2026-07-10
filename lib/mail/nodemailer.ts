import nodemailer from "nodemailer";
import { getInviteEmailHtml, getInviteEmailSubject, getInviteEmailText } from "@/lib/mail/templates";

export type InviteEmailErrorCode =
  | "SMTP_MISSING"
  | "SMTP_AUTH_FAILED"
  | "SMTP_CONNECTION_FAILED"
  | "SMTP_SEND_FAILED"
  | "UNKNOWN";

export class InviteEmailError extends Error {
  code: InviteEmailErrorCode;
  cause?: unknown;

  constructor(code: InviteEmailErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "InviteEmailError";
    this.code = code;
    this.cause = cause;
  }
}

function classifySmtpError(error: unknown): InviteEmailErrorCode {
  if (error instanceof InviteEmailError) {
    return error.code;
  }

  const smtpError = error as { code?: string; command?: string; responseCode?: number };
  const code = String(smtpError.code ?? "").toUpperCase();
  const command = String(smtpError.command ?? "").toUpperCase();

  if (code === "EAUTH" || smtpError.responseCode === 535 || command === "AUTH") {
    return "SMTP_AUTH_FAILED";
  }

  if (
    ["ECONNECTION", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ESOCKET", "ENOTFOUND", "EHOSTUNREACH"].includes(code)
  ) {
    return "SMTP_CONNECTION_FAILED";
  }

  if (code || smtpError.responseCode) {
    return "SMTP_SEND_FAILED";
  }

  return "UNKNOWN";
}

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new InviteEmailError("SMTP_MISSING", "SMTP is not configured.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });
}

export function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendInviteEmail({
  to,
  inviteLink,
  companyName,
  roleLabel,
  expiresAt
}: {
  to: string;
  inviteLink: string;
  companyName: string;
  roleLabel: string;
  expiresAt: string;
}) {
  const from = process.env.SMTP_FROM || "GETH <hello@geth.com>";
  const replyTo = process.env.SMTP_REPLY_TO || undefined;

  try {
    await getTransport().sendMail({
      from,
      replyTo,
      to,
      subject: getInviteEmailSubject(companyName),
      text: getInviteEmailText({ recipientEmail: to, inviteLink, companyName, roleLabel, expiresAt }),
      html: getInviteEmailHtml({ recipientEmail: to, inviteLink, companyName, roleLabel, expiresAt })
    });
  } catch (error) {
    throw new InviteEmailError(classifySmtpError(error), "Invitation email could not be sent.", error);
  }
}
