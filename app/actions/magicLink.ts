"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveAuthUserIdByEmail } from "@/lib/auth/resolve-auth-user-id";
import { buildAuthCallbackEmailLink } from "@/lib/auth/build-auth-callback-link";
import { getAuthCallbackUrl } from "@/lib/app-url";
import { InviteEmailError, sendMagicLinkEmail } from "@/lib/mail/nodemailer";
import type { ActionResult } from "@/lib/actions/types";

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

/**
 * Sends a Supabase-issued login (magic link) or signup (invite) email via the admin API,
 * delivered through the app's own SMTP instead of Supabase's built-in mailer.
 *
 * Public — no auth required to call (that's the point: it's how a user gets authenticated).
 * For `mode: "login"` the email must already belong to a known account.
 */
export async function requestMagicLinkEmail(input: {
  email: string;
  mode: MagicLinkMode;
  redirectTo: string;
  metadata?: {
    full_name?: string;
    company?: string;
    role?: string;
  };
}): Promise<ActionResult> {
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

    if (input.mode === "login") {
      const { userId, error: lookupError } = await resolveAuthUserIdByEmail(admin, email);
      if (!userId) {
        return {
          ok: false as const,
          error: lookupError ?? "No account was found for that email. Check the address or sign up first."
        };
      }
    }

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

    const properties = data.properties ?? {};
    const magicLink = buildAuthCallbackEmailLink(
      properties,
      redirectTo,
      input.mode === "signup" ? "invite" : "magiclink"
    );

    const displayName =
      typeof data.user?.user_metadata?.full_name === "string" ? data.user.user_metadata.full_name : undefined;

    await sendMagicLinkEmail({
      to: email,
      magicLink,
      mode: input.mode,
      displayName
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
