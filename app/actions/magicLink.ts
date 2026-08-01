"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildAuthCallbackEmailLink } from "@/lib/auth/build-auth-callback-link";
import { getAuthCallbackUrl } from "@/lib/app-url";
import { InviteEmailError, sendMagicLinkEmail } from "@/lib/mail/nodemailer";

type MagicLinkMode = "login" | "signup";

function buildServerAuthCallbackRedirect(clientRedirect: string) {
  try {
    const clientUrl = new URL(clientRedirect);
    const callbackUrl = new URL(getAuthCallbackUrl());

    for (const key of ["invite", "role", "next"]) {
      const value = clientUrl.searchParams.get(key);
      if (value) {
        callbackUrl.searchParams.set(key, value);
      }
    }

    return callbackUrl.toString();
  } catch {
    return getAuthCallbackUrl();
  }
}

function getSmtpErrorMessage(error: InviteEmailError) {
  switch (error.code) {
    case "SMTP_MISSING":
      return "Email is not configured on the server yet. Contact support or try again later.";
    case "SMTP_AUTH_FAILED":
      return "Email login failed for info@geth.pro. Check SMTP username and password on the server.";
    case "SMTP_CONNECTION_FAILED":
      return "Could not connect to the mail server. Check SMTP host and port settings.";
    case "SMTP_SEND_FAILED":
      return "The mail server rejected the message. Check that info@geth.pro is allowed to send.";
    default:
      return error.message;
  }
}

export async function requestMagicLinkEmail(input: {
  email: string;
  mode: MagicLinkMode;
  redirectTo: string;
  metadata?: {
    full_name?: string;
    company?: string;
    role?: string;
  };
}) {
  const email = input.email.trim().toLowerCase();

  if (!email) {
    return { ok: false as const, error: "Enter your work email first." };
  }

  try {
    const admin = createSupabaseAdminClient();
    const redirectTo = buildServerAuthCallbackRedirect(input.redirectTo);
    const linkOptions = {
      redirectTo,
      data: input.metadata ?? undefined
    };

    const { data, error } =
      input.mode === "signup"
        ? await admin.auth.admin.generateLink({
            type: "invite",
            email,
            options: linkOptions
          })
        : await admin.auth.admin.generateLink({
            type: "magiclink",
            email,
            options: linkOptions
          });

    if (error) {
      throw error;
    }

    const magicLink = buildAuthCallbackEmailLink(
      data.properties ?? {},
      redirectTo,
      input.mode === "signup" ? "invite" : "magiclink"
    );

    await sendMagicLinkEmail({
      to: email,
      magicLink,
      mode: input.mode
    });

    return { ok: true as const };
  } catch (error) {
    if (error instanceof InviteEmailError) {
      return { ok: false as const, error: getSmtpErrorMessage(error) };
    }

    const authMessage =
      error && typeof error === "object" && "message" in error && typeof error.message === "string"
        ? error.message
        : null;

    return {
      ok: false as const,
      error: authMessage ?? "We could not send that magic link. Check your email and SMTP settings."
    };
  }
}
