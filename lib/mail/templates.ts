type InviteEmailInput = {
  recipientEmail: string;
  inviteLink: string;
  companyName: string;
  roleLabel: string;
  expiresAt: string;
  locale?: string;
};

type InvoiceEmailInput = {
  companyName: string;
  invoiceNumber: string;
  totalLabel: string;
  dueDate: string;
  invoiceUrl: string;
};

const emailFontStack = "Stolzl, system-ui, -apple-system, Segoe UI, Arial, sans-serif";

const emailColors = {
  pageBg: "#fbf8f1",
  cardBg: "#fffdf8",
  border: "#e7ded0",
  ink: "#241033",
  muted: "#6c6174",
  link: "#6f5793",
  accent: "#d8a23a",
  header: "#16091f"
};

function formatExpiry(value: string, locale = "en") {
  return new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function brandNameHtml() {
  return `GETH<sup style="font-size:11px;vertical-align:super;line-height:0;font-weight:800;">®</sup>`;
}

function emailBrandHeader(subtitle: string) {
  return `
    <td style="background:${emailColors.header};padding:28px 32px;color:#ffffff;">
      <div style="font-size:28px;letter-spacing:0.28em;font-weight:800;line-height:1.1;">${brandNameHtml()}</div>
      <div style="margin-top:8px;font-size:11px;letter-spacing:0.2em;color:${emailColors.accent};text-transform:uppercase;">${subtitle}</div>
    </td>
  `;
}

function emailPrimaryButton(href: string, label: string) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0;">
      <tr>
        <td align="center" bgcolor="${emailColors.accent}" style="border-radius:14px;background:${emailColors.accent};">
          <a
            href="${href}"
            target="_blank"
            rel="noopener noreferrer"
            style="display:inline-block;padding:16px 28px;color:${emailColors.ink};font-family:${emailFontStack};font-size:16px;font-weight:800;text-decoration:none;border-radius:14px;line-height:1.2;"
          >
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function emailAccountCard(email: string, displayName?: string | null) {
  const label = displayName?.trim() ? "Signing in as" : "Your account";
  const primary = displayName?.trim() || email;

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 22px;background:${emailColors.pageBg};border:1px solid ${emailColors.border};border-radius:16px;">
      <tr>
        <td style="padding:14px 18px;">
          <div style="font-size:11px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#b98325;">${label}</div>
          <div style="margin-top:6px;font-size:17px;font-weight:700;color:${emailColors.ink};line-height:1.4;">${primary}</div>
          ${displayName?.trim() ? `<div style="margin-top:4px;font-size:14px;line-height:1.5;color:${emailColors.muted};">${email}</div>` : ""}
        </td>
      </tr>
    </table>
  `;
}

function emailFallbackLink(href: string) {
  return `
    <p style="margin:28px 0 8px;font-size:13px;line-height:1.6;color:${emailColors.muted};">If the button does not work, copy and paste this secure link into your browser:</p>
    <p style="word-break:break-all;margin:0;font-size:12px;line-height:1.6;color:${emailColors.link};">${href}</p>
  `;
}

function emailShell({
  subtitle,
  bodyHtml,
  footerHtml
}: {
  subtitle: string;
  bodyHtml: string;
  footerHtml?: string;
}) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0;padding:0;background:${emailColors.pageBg};font-family:${emailFontStack};color:${emailColors.ink};">
      <tr>
        <td align="center" style="padding:40px 20px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:${emailColors.cardBg};border:1px solid ${emailColors.border};border-radius:24px;overflow:hidden;">
            <tr>${emailBrandHeader(subtitle)}</tr>
            <tr>
              <td style="padding:34px 32px 28px;">
                ${bodyHtml}
              </td>
            </tr>
            ${
              footerHtml
                ? `<tr><td style="padding:18px 32px 28px;border-top:1px solid ${emailColors.border};color:${emailColors.muted};font-size:12px;line-height:1.6;">${footerHtml}</td></tr>`
                : ""
            }
          </table>
          <p style="margin:18px 0 0;font-size:11px;line-height:1.5;color:${emailColors.muted};">Sent by GETH® · info@geth.pro</p>
        </td>
      </tr>
    </table>
  `;
}

export function getInviteEmailSubject(companyName: string, locale = "en") {
  return locale === "nl"
    ? `Je bent uitgenodigd voor ${companyName} op GETH®`
    : `You're invited to join ${companyName} on GETH®`;
}

export function getInviteEmailHtml({
  recipientEmail,
  inviteLink,
  companyName,
  roleLabel,
  expiresAt,
  locale = "en"
}: InviteEmailInput) {
  const expiryLabel = formatExpiry(expiresAt, locale);
  const isNl = locale === "nl";

  return emailShell({
    subtitle: isNl ? "Erken om te energiseren" : "Recognize to energize",
    bodyHtml: `
      <p style="margin:0 0 10px;color:#b98325;font-size:12px;font-weight:800;letter-spacing:0.24em;text-transform:uppercase;">${isNl ? "Werkplekuitnodiging" : "Workspace invitation"}</p>
      <h1 style="margin:0 0 14px;font-size:34px;line-height:1.05;color:${emailColors.ink};">${isNl ? `Word lid van ${companyName} op GETH®` : `Join ${companyName} on GETH®`}</h1>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:${emailColors.muted};">
        ${isNl
          ? `Je bent uitgenodigd als <strong>${roleLabel}</strong> voor <strong>${companyName}</strong>. Maak je account aan om waarderingskaarten te claimen, teaminzichten te zien en een sterkere erkenningscultuur te bouwen.`
          : `You have been invited as <strong>${roleLabel}</strong> for <strong>${companyName}</strong>. Create your account to claim recognition cards, see team insights, and help build a stronger recognition culture.`}
      </p>
      ${emailAccountCard(recipientEmail)}
      ${emailPrimaryButton(inviteLink, isNl ? "Uitnodiging accepteren" : "Accept invitation")}
      <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:${emailColors.muted};">${isNl ? "Deze uitnodiging verloopt op" : "This invitation expires on"} <strong>${expiryLabel}</strong>.</p>
      ${emailFallbackLink(inviteLink)}
    `,
    footerHtml: isNl
      ? "Deze uitnodiging is privé voor je e-mailadres. Als je deze niet verwachtte, kun je dit bericht negeren."
      : "This invitation is private to your email address. If you were not expecting it, you can ignore this message."
  });
}

export function getInviteEmailText({
  recipientEmail,
  inviteLink,
  companyName,
  roleLabel,
  expiresAt,
  locale = "en"
}: InviteEmailInput) {
  const expiryLabel = formatExpiry(expiresAt, locale);

  if (locale === "nl") {
    return `Word lid van ${companyName} op GETH® als ${roleLabel}.\n\nDeze uitnodiging werd verstuurd naar ${recipientEmail} en verloopt op ${expiryLabel}.\n\nAccepteer je uitnodiging:\n${inviteLink}\n\nAls je deze uitnodiging niet verwachtte, kun je dit bericht negeren.`;
  }

  return `Join ${companyName} on GETH® as ${roleLabel}.\n\nThis invitation was sent to ${recipientEmail} and expires on ${expiryLabel}.\n\nAccept your invitation:\n${inviteLink}\n\nIf you were not expecting this invitation, you can ignore this message.`;
}

type CompanyAdminWelcomeEmailInput = {
  recipientEmail: string;
  inviteLink: string;
  companyName: string;
  expiresAt: string;
  locale?: string;
};

function companyAdminBulletList(isNl: boolean) {
  const items = isNl
    ? [
        "Managers en medewerkers uitnodigen",
        "Teams aanmaken",
        "Je organisatie beheren",
        "Je erkenningscultuur volgen via betekenisvolle inzichten",
        "Een werkplek bouwen waar mensen zich gezien en gewaardeerd voelen"
      ]
    : [
        "Invite managers and employees",
        "Create teams",
        "Manage your organisation",
        "Monitor your recognition culture through meaningful insights",
        "Help build a workplace where people feel seen and appreciated"
      ];

  return `<ul style="margin:0 0 18px;padding-left:22px;font-size:16px;line-height:1.7;color:${emailColors.muted};">${items.map((item) => `<li style="margin-bottom:8px;">${item}</li>`).join("")}</ul>`;
}

export function getCompanyAdminWelcomeEmailSubject(locale = "en") {
  return locale === "nl"
    ? "Welkom bij GETH® – Je bedrijfsomgeving is klaar"
    : "Welcome to GETH® – Your company workspace is ready";
}

export function getCompanyAdminWelcomeEmailHtml({
  recipientEmail,
  inviteLink,
  companyName,
  expiresAt,
  locale = "en"
}: CompanyAdminWelcomeEmailInput) {
  const expiryLabel = formatExpiry(expiresAt, locale);
  const isNl = locale === "nl";

  return emailShell({
    subtitle: isNl ? "Erken om te energiseren" : "Recognize to energize",
    bodyHtml: `
      <p style="margin:0 0 10px;color:#b98325;font-size:12px;font-weight:800;letter-spacing:0.24em;text-transform:uppercase;">${isNl ? "Bedrijfsbeheerder" : "Company administrator"}</p>
      <h1 style="margin:0 0 14px;font-size:34px;line-height:1.05;color:${emailColors.ink};">${isNl ? "Welkom bij GETH® – Je bedrijfsomgeving is klaar" : "Welcome to GETH® – Your company workspace is ready"}</h1>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:${emailColors.muted};">
        ${isNl ? "Welkom bij GETH®." : "Welcome to GETH®."}
      </p>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:${emailColors.muted};">
        ${isNl
          ? `Er is een privé GETH®-bedrijfsomgeving aangemaakt voor <strong>${companyName}</strong>, en jij bent aangewezen als bedrijfsbeheerder.`
          : `A private GETH® Company Workspace has been created for <strong>${companyName}</strong>, and you have been assigned as the Company Administrator.`}
      </p>
      <p style="margin:0 0 10px;font-size:16px;line-height:1.7;color:${emailColors.ink};font-weight:700;">
        ${isNl ? "Als bedrijfsbeheerder kun je:" : "As Company Admin, you can:"}
      </p>
      ${companyAdminBulletList(isNl)}
      <p style="margin:0 0 22px;font-size:16px;line-height:1.7;color:${emailColors.muted};">
        ${isNl ? "Aan de slag gaan duurt maar een minuut." : "Getting started only takes a minute."}
      </p>
      ${emailAccountCard(recipientEmail)}
      ${emailPrimaryButton(inviteLink, isNl ? "Activeer je GETH®-bedrijfsomgeving" : "Activate your GETH® Company Workspace")}
      <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:${emailColors.muted};">${isNl ? "Deze uitnodiging verloopt op" : "This invitation expires on"} <strong>${expiryLabel}</strong>.</p>
      <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:${emailColors.muted};">
        ${isNl ? "Heb je vragen? We helpen je graag." : "If you have any questions, we're here to help."}
      </p>
      <p style="margin:18px 0 0;font-size:16px;line-height:1.7;color:${emailColors.ink};font-weight:700;">${isNl ? "Welkom bij GETH®." : "Welcome to GETH®."}</p>
      ${emailFallbackLink(inviteLink)}
    `,
    footerHtml: isNl
      ? "Deze uitnodiging is privé voor je e-mailadres. Als je deze niet verwachtte, kun je dit bericht negeren."
      : "This invitation is private to your email address. If you were not expecting it, you can ignore this message."
  });
}

export function getCompanyAdminWelcomeEmailText({
  recipientEmail,
  inviteLink,
  companyName,
  expiresAt,
  locale = "en"
}: CompanyAdminWelcomeEmailInput) {
  const expiryLabel = formatExpiry(expiresAt, locale);

  if (locale === "nl") {
    return `Welkom bij GETH® – Je bedrijfsomgeving is klaar\n\nWelkom bij GETH®.\n\nEr is een privé GETH®-bedrijfsomgeving aangemaakt voor ${companyName}, en jij bent aangewezen als bedrijfsbeheerder.\n\nAls bedrijfsbeheerder kun je:\n- Managers en medewerkers uitnodigen\n- Teams aanmaken\n- Je organisatie beheren\n- Je erkenningscultuur volgen via betekenisvolle inzichten\n- Een werkplek bouwen waar mensen zich gezien en gewaardeerd voelen\n\nAan de slag gaan duurt maar een minuut.\n\nDeze uitnodiging werd verstuurd naar ${recipientEmail} en verloopt op ${expiryLabel}.\n\nActiveer je GETH®-bedrijfsomgeving:\n${inviteLink}\n\nHeb je vragen? We helpen je graag.\n\nWelkom bij GETH®.`;
  }

  return `Welcome to GETH® – Your company workspace is ready\n\nWelcome to GETH®.\n\nA private GETH® Company Workspace has been created for ${companyName}, and you have been assigned as the Company Administrator.\n\nAs Company Admin, you can:\n- Invite managers and employees\n- Create teams\n- Manage your organisation\n- Monitor your recognition culture through meaningful insights\n- Help build a workplace where people feel seen and appreciated\n\nGetting started only takes a minute.\n\nThis invitation was sent to ${recipientEmail} and expires on ${expiryLabel}.\n\nActivate your GETH® Company Workspace:\n${inviteLink}\n\nIf you have any questions, we're here to help.\n\nWelcome to GETH®.`;
}

export function getInvoiceEmailSubject(invoiceNumber: string) {
  return `GETH® invoice ${invoiceNumber}`;
}

export function getInvoiceEmailHtml({ companyName, invoiceNumber, totalLabel, dueDate, invoiceUrl }: InvoiceEmailInput) {
  return emailShell({
    subtitle: "Invoice billing",
    bodyHtml: `
      <p style="margin:0 0 10px;color:#b98325;font-size:12px;font-weight:800;letter-spacing:0.24em;text-transform:uppercase;">Invoice generated</p>
      <h1 style="margin:0 0 14px;font-size:32px;line-height:1.08;color:${emailColors.ink};">Invoice ${invoiceNumber}</h1>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:${emailColors.muted};">
        Your GETH® invoice for <strong>${companyName}</strong> has been generated. The total is <strong>${totalLabel}</strong> and payment is due on <strong>${formatExpiry(dueDate)}</strong>.
      </p>
      ${emailPrimaryButton(invoiceUrl, "Download invoice PDF")}
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:${emailColors.muted};">The PDF is also attached to this email.</p>
      ${emailFallbackLink(invoiceUrl)}
    `
  });
}

export function getInvoiceEmailText({ companyName, invoiceNumber, totalLabel, dueDate, invoiceUrl }: InvoiceEmailInput) {
  return `GETH® invoice ${invoiceNumber}\n\nCompany: ${companyName}\nTotal: ${totalLabel}\nDue date: ${formatExpiry(dueDate)}\n\nDownload invoice PDF:\n${invoiceUrl}\n\nThe PDF is also attached to this email.`;
}

type MagicLinkEmailInput = {
  recipientEmail: string;
  magicLink: string;
  mode: "login" | "signup";
  displayName?: string | null;
};

export function getMagicLinkEmailSubject(mode: MagicLinkEmailInput["mode"]) {
  return mode === "signup" ? "Finish your GETH® account setup" : "Your GETH® sign-in link";
}

export function getMagicLinkEmailHtml({ recipientEmail, magicLink, mode, displayName }: MagicLinkEmailInput) {
  const accountLabel = displayName?.trim() || recipientEmail;
  const headline = mode === "signup" ? "Finish setting up your GETH® account" : "Sign in to your GETH® workspace";
  const copy =
    mode === "signup"
      ? "Tap the button below to confirm your email and complete your GETH® account setup. This secure link signs you in automatically."
      : "Tap the button below to sign in to your GETH® workspace. This one-time link is private to your account and expires shortly.";
  const buttonLabel = mode === "signup" ? `Complete setup for ${accountLabel}` : `Sign in as ${accountLabel}`;

  return emailShell({
    subtitle: "Recognize to energize",
    bodyHtml: `
      <p style="margin:0 0 10px;color:#b98325;font-size:12px;font-weight:800;letter-spacing:0.24em;text-transform:uppercase;">Secure sign-in</p>
      <h1 style="margin:0 0 14px;font-size:34px;line-height:1.05;color:${emailColors.ink};">${headline}</h1>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:${emailColors.muted};">${copy}</p>
      ${emailAccountCard(recipientEmail, displayName)}
      ${emailPrimaryButton(magicLink, buttonLabel)}
      ${emailFallbackLink(magicLink)}
    `,
    footerHtml: "If you did not request this email, you can ignore it. This link can only be used once."
  });
}

export function getMagicLinkEmailText({ recipientEmail, magicLink, mode, displayName }: MagicLinkEmailInput) {
  const accountLabel = displayName?.trim() || recipientEmail;
  const headline = mode === "signup" ? "Finish setting up your GETH® account" : "Sign in to your GETH® workspace";
  const buttonLabel = mode === "signup" ? `Complete setup for ${accountLabel}` : `Sign in as ${accountLabel}`;

  return `${headline}\n\nAccount: ${recipientEmail}\n${displayName?.trim() ? `Name: ${displayName.trim()}\n` : ""}\n${buttonLabel}:\n${magicLink}\n\nIf you did not request this email, you can ignore it.`;
}

type PasswordResetEmailInput = {
  recipientEmail: string;
  resetLink: string;
};

export function getPasswordResetEmailSubject() {
  return "Reset your GETH® password";
}

export function getPasswordResetEmailHtml({ recipientEmail, resetLink }: PasswordResetEmailInput) {
  return emailShell({
    subtitle: "Recognize to energize",
    bodyHtml: `
      <p style="margin:0 0 10px;color:#b98325;font-size:12px;font-weight:800;letter-spacing:0.24em;text-transform:uppercase;">Secure account recovery</p>
      <h1 style="margin:0 0 14px;font-size:34px;line-height:1.05;color:${emailColors.ink};">Reset your GETH® password</h1>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:${emailColors.muted};">
        Use the button below to set a new password for your GETH® account.
      </p>
      ${emailAccountCard(recipientEmail)}
      ${emailPrimaryButton(resetLink, "Reset password")}
      ${emailFallbackLink(resetLink)}
    `,
    footerHtml: "If you did not request this email, you can ignore it."
  });
}

export function getPasswordResetEmailText({ recipientEmail, resetLink }: PasswordResetEmailInput) {
  return `Reset your GETH® password\n\nThis link was sent to ${recipientEmail}.\n\nReset password:\n${resetLink}\n\nIf you did not request this email, you can ignore it.`;
}

type RecognitionEmailInput = {
  recipientEmail: string;
  giverName: string;
  cardTitle: string;
  personalNote?: string | null;
  dashboardUrl: string;
  acknowledgementPending?: boolean;
};

export function getRecognitionEmailSubject(giverName: string) {
  return `${giverName} recognized you on GETH®`;
}

export function getRecognitionEmailText({
  recipientEmail,
  giverName,
  cardTitle,
  personalNote,
  dashboardUrl,
  acknowledgementPending
}: RecognitionEmailInput) {
  const lines = [
    `Hi,`,
    "",
    `${giverName} gave you a ${cardTitle} recognition card on GETH®.`,
    acknowledgementPending ? "Please open GETH® to acknowledge that you received it." : "",
    personalNote?.trim() ? `Personal note: ${personalNote.trim()}` : "",
    "",
    `Open your dashboard: ${dashboardUrl}`,
    "",
    `This message was sent to ${recipientEmail}.`
  ];
  return lines.filter(Boolean).join("\n");
}

export function getRecognitionEmailHtml({
  recipientEmail,
  giverName,
  cardTitle,
  personalNote,
  dashboardUrl,
  acknowledgementPending
}: RecognitionEmailInput) {
  const noteBlock = personalNote?.trim()
    ? `<p style="margin:0 0 18px;padding:14px 16px;border-radius:14px;background:${emailColors.pageBg};border:1px solid ${emailColors.border};color:${emailColors.ink};font-size:15px;line-height:1.6;">${personalNote.trim()}</p>`
    : "";

  return emailShell({
    subtitle: "Recognize to energize",
    bodyHtml: `
      <p style="margin:0 0 10px;color:#b98325;font-size:12px;font-weight:800;letter-spacing:0.24em;text-transform:uppercase;">Recognition received</p>
      <h1 style="margin:0 0 14px;font-size:30px;line-height:1.1;color:${emailColors.ink};">${giverName} gave you ${cardTitle}</h1>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:${emailColors.muted};">
        ${acknowledgementPending ? "Open GETH® to acknowledge this card and keep your recognition momentum going." : "Your teammate shared recognition with you on GETH®."}
      </p>
      ${noteBlock}
      ${emailPrimaryButton(dashboardUrl, "Open your dashboard")}
      ${emailFallbackLink(dashboardUrl)}
    `,
    footerHtml: `Sent to <strong>${recipientEmail}</strong>`
  });
}
