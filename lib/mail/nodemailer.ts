import nodemailer from "nodemailer";
import {
  getInviteEmailHtml,
  getInviteEmailSubject,
  getInviteEmailText,
  getInvoiceEmailHtml,
  getInvoiceEmailSubject,
  getInvoiceEmailText,
  getMagicLinkEmailHtml,
  getMagicLinkEmailSubject,
  getMagicLinkEmailText,
  getPasswordResetEmailHtml,
  getPasswordResetEmailSubject,
  getPasswordResetEmailText,
  getRecognitionEmailHtml,
  getRecognitionEmailSubject,
  getRecognitionEmailText
} from "@/lib/mail/templates";

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

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  replyTo: string;
  secure: boolean;
};

const requiredSmtpVariables = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "SMTP_REPLY_TO"] as const;

function normalizeEnvValue(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function getSmtpConfigStatus() {
  const missing = requiredSmtpVariables.filter((key) => !normalizeEnvValue(process.env[key]));
  const port = Number(normalizeEnvValue(process.env.SMTP_PORT) || 465);

  return {
    configured: missing.length === 0,
    missing,
    host: normalizeEnvValue(process.env.SMTP_HOST),
    port,
    user: normalizeEnvValue(process.env.SMTP_USER),
    from: normalizeEnvValue(process.env.SMTP_FROM),
    replyTo: normalizeEnvValue(process.env.SMTP_REPLY_TO),
    secure: port === 465
  };
}

function getSmtpConfig(): SmtpConfig {
  const status = getSmtpConfigStatus();

  if (!status.configured) {
    throw new InviteEmailError("SMTP_MISSING", `SMTP is not configured. Missing: ${status.missing.join(", ")}`);
  }

  const from = status.from;
  const user = status.user;
  if (!/geth\.pro/i.test(from) || !/geth\.pro/i.test(user)) {
    console.warn("SMTP_FROM or SMTP_USER is not using info@geth.pro — invite emails may land in spam.");
  }

  return {
    host: status.host,
    port: status.port,
    user: status.user,
    pass: normalizeEnvValue(process.env.SMTP_PASS),
    from: status.from,
    replyTo: status.replyTo,
    secure: status.secure
  };
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

let cachedSmtpTransport: nodemailer.Transporter | null = null;

export function createSmtpTransport() {
  if (cachedSmtpTransport) {
    return cachedSmtpTransport;
  }

  const config = getSmtpConfig();
  cachedSmtpTransport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    },
    pool: true,
    maxConnections: 1,
    maxMessages: 10,
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 20000,
    tls: {
      minVersion: "TLSv1.2"
    }
  });

  return cachedSmtpTransport;
}

export function hasSmtpConfig() {
  return getSmtpConfigStatus().configured;
}

export async function sendMagicLinkEmail({
  to,
  magicLink,
  mode,
  displayName
}: {
  to: string;
  magicLink: string;
  mode: "login" | "signup";
  displayName?: string | null;
}) {
  try {
    const config = getSmtpConfig();
    await createSmtpTransport().sendMail({
      from: config.from,
      replyTo: config.replyTo,
      to,
      subject: getMagicLinkEmailSubject(mode),
      text: getMagicLinkEmailText({ recipientEmail: to, magicLink, mode, displayName }),
      html: getMagicLinkEmailHtml({ recipientEmail: to, magicLink, mode, displayName })
    });
  } catch (error) {
    throw new InviteEmailError(classifySmtpError(error), "Magic link email could not be sent.", error);
  }
}

export async function sendPasswordResetEmail({ to, resetLink }: { to: string; resetLink: string }) {
  try {
    const config = getSmtpConfig();
    await createSmtpTransport().sendMail({
      from: config.from,
      replyTo: config.replyTo,
      to,
      subject: getPasswordResetEmailSubject(),
      text: getPasswordResetEmailText({ recipientEmail: to, resetLink }),
      html: getPasswordResetEmailHtml({ recipientEmail: to, resetLink })
    });
  } catch (error) {
    throw new InviteEmailError(classifySmtpError(error), "Password reset email could not be sent.", error);
  }
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
  try {
    const config = getSmtpConfig();
    await createSmtpTransport().sendMail({
      from: config.from,
      replyTo: config.replyTo,
      to,
      subject: getInviteEmailSubject(companyName),
      text: getInviteEmailText({ recipientEmail: to, inviteLink, companyName, roleLabel, expiresAt }),
      html: getInviteEmailHtml({ recipientEmail: to, inviteLink, companyName, roleLabel, expiresAt })
    });
  } catch (error) {
    throw new InviteEmailError(classifySmtpError(error), "Invitation email could not be sent.", error);
  }
}

export async function sendInvoiceEmail({
  to,
  companyName,
  invoiceNumber,
  totalLabel,
  dueDate,
  invoiceUrl,
  pdf
}: {
  to: string;
  companyName: string;
  invoiceNumber: string;
  totalLabel: string;
  dueDate: string;
  invoiceUrl: string;
  pdf: Buffer;
}) {
  try {
    const config = getSmtpConfig();
    await createSmtpTransport().sendMail({
      from: config.from,
      replyTo: config.replyTo,
      to,
      subject: getInvoiceEmailSubject(invoiceNumber),
      text: getInvoiceEmailText({ companyName, invoiceNumber, totalLabel, dueDate, invoiceUrl }),
      html: getInvoiceEmailHtml({ companyName, invoiceNumber, totalLabel, dueDate, invoiceUrl }),
      attachments: [
        {
          filename: `${invoiceNumber}.pdf`,
          content: pdf,
          contentType: "application/pdf"
        }
      ]
    });
  } catch (error) {
    throw new InviteEmailError(classifySmtpError(error), "Invoice email could not be sent.", error);
  }
}

export async function sendRecognitionReceivedEmail({
  to,
  giverName,
  cardTitle,
  personalNote,
  dashboardUrl,
  acknowledgementPending
}: {
  to: string;
  giverName: string;
  cardTitle: string;
  personalNote?: string | null;
  dashboardUrl: string;
  acknowledgementPending?: boolean;
}) {
  try {
    const config = getSmtpConfig();
    await createSmtpTransport().sendMail({
      from: config.from,
      replyTo: config.replyTo,
      to,
      subject: getRecognitionEmailSubject(giverName),
      text: getRecognitionEmailText({
        recipientEmail: to,
        giverName,
        cardTitle,
        personalNote,
        dashboardUrl,
        acknowledgementPending
      }),
      html: getRecognitionEmailHtml({
        recipientEmail: to,
        giverName,
        cardTitle,
        personalNote,
        dashboardUrl,
        acknowledgementPending
      })
    });
  } catch (error) {
    throw new InviteEmailError(classifySmtpError(error), "Recognition email could not be sent.", error);
  }
}

export async function sendCalendarInviteEmail({
  to,
  subject,
  text,
  ics,
  filename = "geth-final-project-review.ics"
}: {
  to: string;
  subject: string;
  text: string;
  ics: string;
  filename?: string;
}) {
  try {
    const config = getSmtpConfig();
    await createSmtpTransport().sendMail({
      from: config.from,
      replyTo: config.replyTo,
      to,
      subject,
      text,
      icalEvent: {
        filename,
        method: "PUBLISH",
        content: ics
      },
      attachments: [
        {
          filename,
          content: ics,
          contentType: "text/calendar; charset=utf-8"
        }
      ]
    });
  } catch (error) {
    throw new InviteEmailError(classifySmtpError(error), "Calendar invite email could not be sent.", error);
  }
}

export async function sendDemoBookingRequestEmails({
  adminEmails,
  requesterEmail,
  requesterSubject,
  requesterText,
  adminSubject,
  adminText
}: {
  adminEmails: string[];
  requesterEmail: string;
  requesterSubject: string;
  requesterText: string;
  adminSubject: string;
  adminText: string;
}) {
  try {
    const config = getSmtpConfig();
    const transport = createSmtpTransport();
    await transport.sendMail({
      from: config.from,
      replyTo: requesterEmail || config.replyTo,
      to: adminEmails.join(","),
      subject: adminSubject,
      text: adminText
    });
    await transport.sendMail({
      from: config.from,
      replyTo: config.replyTo,
      to: requesterEmail,
      subject: requesterSubject,
      text: requesterText
    });
  } catch (error) {
    throw new InviteEmailError(classifySmtpError(error), "Demo booking email could not be sent.", error);
  }
}

export async function sendDemoBookingDecisionEmail({
  to,
  subject,
  text,
  ics
}: {
  to: string;
  subject: string;
  text: string;
  ics?: string;
}) {
  try {
    const config = getSmtpConfig();
    await createSmtpTransport().sendMail({
      from: config.from,
      replyTo: config.replyTo,
      to,
      subject,
      text,
      ...(ics
        ? {
            icalEvent: {
              filename: "geth-demo.ics",
              method: "PUBLISH",
              content: ics
            },
            attachments: [
              {
                filename: "geth-demo.ics",
                content: ics,
                contentType: "text/calendar; charset=utf-8"
              }
            ]
          }
        : {})
    });
  } catch (error) {
    throw new InviteEmailError(classifySmtpError(error), "Demo booking decision email could not be sent.", error);
  }
}
