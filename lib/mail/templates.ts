type InviteEmailInput = {
  recipientEmail: string;
  inviteLink: string;
  companyName: string;
  roleLabel: string;
  expiresAt: string;
};

type InvoiceEmailInput = {
  companyName: string;
  invoiceNumber: string;
  totalLabel: string;
  dueDate: string;
  invoiceUrl: string;
};

const emailFontStack = "Aptos, Segoe UI, Helvetica Neue, Arial, sans-serif";

export function getInviteEmailSubject(companyName: string) {
  return `You're invited to join ${companyName} on GETH`;
}

function formatExpiry(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function getInviteEmailHtml({ recipientEmail, inviteLink, companyName, roleLabel, expiresAt }: InviteEmailInput) {
  const expiryLabel = formatExpiry(expiresAt);

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0;padding:0;background:#fbf8f1;font-family:${emailFontStack};color:#241033;">
      <tr>
        <td align="center" style="padding:40px 20px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fffdf8;border:1px solid #e7ded0;border-radius:24px;overflow:hidden;">
            <tr>
              <td style="background:#16091f;padding:28px 32px;color:#ffffff;">
                <div style="font-size:28px;letter-spacing:0.38em;font-weight:800;">GETH</div>
                <div style="margin-top:6px;font-size:11px;letter-spacing:0.2em;color:#d8a23a;text-transform:uppercase;">Recognize to energize</div>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 32px 28px;">
                <p style="margin:0 0 10px;color:#b98325;font-size:12px;font-weight:800;letter-spacing:0.24em;text-transform:uppercase;">Workspace invitation</p>
                <h1 style="margin:0 0 14px;font-size:34px;line-height:1.05;color:#241033;">Join ${companyName} on GETH</h1>
                <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#6c6174;">
                  You have been invited as ${roleLabel} for <strong>${companyName}</strong>. This invitation was sent to <strong>${recipientEmail}</strong>.
                  Create your account to claim recognition cards, see team insights, and help build a stronger recognition culture.
                </p>
                <a href="${inviteLink}" style="display:inline-block;background:#d8a23a;color:#241033;text-decoration:none;font-weight:800;padding:15px 22px;border-radius:14px;">
                  Accept invitation
                </a>
                <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#6c6174;">This invitation expires on <strong>${expiryLabel}</strong>.</p>
                <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#6c6174;">If the button does not work, copy and paste this link into your browser:</p>
                <p style="word-break:break-all;margin:8px 0 0;font-size:12px;line-height:1.6;color:#6f5793;">${inviteLink}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px 28px;border-top:1px solid #e7ded0;color:#6c6174;font-size:12px;line-height:1.6;">
                This invitation is private to your email address. If you were not expecting it, you can ignore this message.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

export function getInviteEmailText({ recipientEmail, inviteLink, companyName, roleLabel, expiresAt }: InviteEmailInput) {
  return `Join ${companyName} on GETH as ${roleLabel}.\n\nThis invitation was sent to ${recipientEmail} and expires on ${formatExpiry(expiresAt)}.\n\nAccept your invitation:\n${inviteLink}\n\nIf you were not expecting this invitation, you can ignore this message.`;
}

export function getInvoiceEmailSubject(invoiceNumber: string) {
  return `GETH invoice ${invoiceNumber}`;
}

export function getInvoiceEmailHtml({ companyName, invoiceNumber, totalLabel, dueDate, invoiceUrl }: InvoiceEmailInput) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0;padding:0;background:#fbf8f1;font-family:${emailFontStack};color:#241033;">
      <tr>
        <td align="center" style="padding:40px 20px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fffdf8;border:1px solid #e7ded0;border-radius:24px;overflow:hidden;">
            <tr>
              <td style="background:#16091f;padding:28px 32px;color:#ffffff;">
                <div style="font-size:28px;letter-spacing:0.12em;font-weight:800;">GETH</div>
                <div style="margin-top:6px;font-size:11px;letter-spacing:0.2em;color:#d8a23a;text-transform:uppercase;">Invoice billing</div>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 32px 28px;">
                <p style="margin:0 0 10px;color:#b98325;font-size:12px;font-weight:800;letter-spacing:0.24em;text-transform:uppercase;">Invoice generated</p>
                <h1 style="margin:0 0 14px;font-size:32px;line-height:1.08;color:#241033;">Invoice ${invoiceNumber}</h1>
                <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#6c6174;">
                  Your GETH invoice for <strong>${companyName}</strong> has been generated. The total is <strong>${totalLabel}</strong> and payment is due on <strong>${formatExpiry(dueDate)}</strong>.
                </p>
                <a href="${invoiceUrl}" style="display:inline-block;background:#d8a23a;color:#241033;text-decoration:none;font-weight:800;padding:15px 22px;border-radius:14px;">
                  Download invoice PDF
                </a>
                <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6c6174;">The PDF is also attached to this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

export function getInvoiceEmailText({ companyName, invoiceNumber, totalLabel, dueDate, invoiceUrl }: InvoiceEmailInput) {
  return `GETH invoice ${invoiceNumber}\n\nCompany: ${companyName}\nTotal: ${totalLabel}\nDue date: ${formatExpiry(dueDate)}\n\nDownload invoice PDF:\n${invoiceUrl}\n\nThe PDF is also attached to this email.`;
}
