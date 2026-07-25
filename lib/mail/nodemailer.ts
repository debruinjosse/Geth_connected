import nodemailer from "nodemailer";
import {
  getInviteEmailHtml,
  getInviteEmailSubject,
  getInviteEmailText,
  getInvoiceEmailHtml,
  getInvoiceEmailSubject,
  getInvoiceEmailText
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

export function getSmtpConfigStatus() {
  const missing = requiredSmtpVariables.filter((key) => !process.env[key]?.trim());
  const port = Number(process.env.SMTP_PORT || 465);

  return {
    configured: missing.length === 0,
    missing,
    host: process.env.SMTP_HOST || "",
    port,
    user: process.env.SMTP_USER || "",
    from: process.env.SMTP_FROM || "",
    replyTo: process.env.SMTP_REPLY_TO || "",
    secure: port === 465
  };
}

function getSmtpConfig(): SmtpConfig {
  const status = getSmtpConfigStatus();

  if (!status.configured) {
    throw new InviteEmailError("SMTP_MISSING", `SMTP is not configured. Missing: ${status.missing.join(", ")}`);
  }

  return {
    host: status.host,
    port: status.port,
    user: status.user,
    pass: process.env.SMTP_PASS!,
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

export function createSmtpTransport() {
  const config = getSmtpConfig();
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });
}

export function hasSmtpConfig() {
  return getSmtpConfigStatus().configured;
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
  requesterName,
  company,
  teamSize,
  role,
  preferredSlot,
  message,
  adminUrl
}: {
  adminEmails: string[];
  requesterEmail: string;
  requesterName: string;
  company: string;
  teamSize: string;
  role: string;
  preferredSlot: string;
  message: string;
  adminUrl: string;
}) {
  const adminText = [
    "New GETH demo request",
    "",
    `Name: ${requesterName}`,
    `Email: ${requesterEmail}`,
    `Company: ${company}`,
    `Team size: ${teamSize}`,
    `Role: ${role}`,
    `Preferred slot: ${preferredSlot}`,
    "",
    `Message: ${message || "No message provided."}`,
    "",
    `Approve or decline: ${adminUrl}`
  ].join("\n");

  const requesterText = [
    `Hi ${requesterName},`,
    "",
    "Thanks for booking a GETH demo. We received your request and will confirm the time shortly.",
    "",
    `Preferred slot: ${preferredSlot}`,
    `Company: ${company}`,
    "",
    "If anything changes, reply to this email."
  ].join("\n");

  try {
    const config = getSmtpConfig();
    const transport = createSmtpTransport();
    await transport.sendMail({
      from: config.from,
      replyTo: requesterEmail || config.replyTo,
      to: adminEmails.join(","),
      subject: `New GETH demo request - ${company}`,
      text: adminText
    });
    await transport.sendMail({
      from: config.from,
      replyTo: config.replyTo,
      to: requesterEmail,
      subject: "GETH demo request received",
      text: requesterText
    });
  } catch (error) {
    throw new InviteEmailError(classifySmtpError(error), "Demo booking email could not be sent.", error);
  }
}

export async function sendDemoBookingDecisionEmail({
  to,
  requesterName,
  company,
  status,
  preferredSlot,
  adminNote,
  ics
}: {
  to: string;
  requesterName: string;
  company: string;
  status: "approved" | "declined";
  preferredSlot: string;
  adminNote: string;
  ics?: string;
}) {
  const approved = status === "approved";
  const text = [
    `Hi ${requesterName},`,
    "",
    approved
      ? `Your GETH demo for ${company} has been approved.`
      : `Thanks for your interest in GETH. We cannot confirm the requested demo slot for ${company} yet.`,
    `Requested slot: ${preferredSlot}`,
    adminNote ? `Note: ${adminNote}` : "",
    "",
    approved ? "A calendar file is attached so you can add it to Google Calendar, Outlook, or Apple Calendar." : "Please reply to this email and we will find another suitable time."
  ].filter(Boolean).join("\n");

  try {
    const config = getSmtpConfig();
    await createSmtpTransport().sendMail({
      from: config.from,
      replyTo: config.replyTo,
      to,
      subject: approved ? "Your GETH demo is confirmed" : "GETH demo request update",
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
