"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { InviteEmailError, sendMagicLinkEmail } from "@/lib/mail/nodemailer";

type MagicLinkMode = "login" | "signup";

function buildEmailMagicLink(
  properties: {
    action_link?: string | null;
    hashed_token?: string | null;
    verification_type?: string | null;
  },
  redirectTo: string,
  mode: MagicLinkMode
) {
  const hashedToken = properties.hashed_token?.trim();
  if (hashedToken) {
    const callbackUrl = new URL(redirectTo);
    callbackUrl.searchParams.set("token_hash", hashedToken);
    const verificationType =
      properties.verification_type?.trim() || (mode === "signup" ? "invite" : "magiclink");
    callbackUrl.searchParams.set("type", verificationType);
    return callbackUrl.toString();
  }

  const fallback = properties.action_link?.trim();
  if (!fallback) {
    throw new Error("We could not generate a sign-in link for that email.");
  }

  return fallback;
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
    const linkOptions = {
      redirectTo: input.redirectTo,
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

    const magicLink = buildEmailMagicLink(data.properties ?? {}, input.redirectTo, input.mode);

    await sendMagicLinkEmail({
      to: email,
      magicLink,
      mode: input.mode
    });

    return { ok: true as const };
  } catch (error) {
    if (error instanceof InviteEmailError) {
      return { ok: false as const, error: error.message };
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
