"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { InviteEmailError, sendMagicLinkEmail } from "@/lib/mail/nodemailer";

type MagicLinkMode = "login" | "signup";

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
    const linkType = input.mode === "signup" ? "signup" : "magiclink";

    const { data, error } = await admin.auth.admin.generateLink({
      type: linkType,
      email,
      options: {
        redirectTo: input.redirectTo,
        data: input.metadata ?? undefined
      }
    });

    if (error) {
      throw error;
    }

    const magicLink = data.properties?.action_link;
    if (!magicLink) {
      throw new Error("We could not generate a sign-in link for that email.");
    }

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
