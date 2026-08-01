"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildAuthCallbackEmailLink } from "@/lib/auth/build-auth-callback-link";
import { getAuthCallbackUrl } from "@/lib/app-url";
import { InviteEmailError, sendPasswordResetEmail } from "@/lib/mail/nodemailer";

export async function requestPasswordResetEmail(email: string) {
  const normalized = email.trim().toLowerCase();

  if (!normalized) {
    return { ok: false as const, error: "Enter your work email first." };
  }

  try {
    const admin = createSupabaseAdminClient();
    const redirectTo = getAuthCallbackUrl("/reset-password");

    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: normalized,
      options: { redirectTo }
    });

    if (error) {
      throw error;
    }

    const resetLink = buildAuthCallbackEmailLink(data.properties ?? {}, redirectTo, "recovery");

    await sendPasswordResetEmail({
      to: normalized,
      resetLink
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
      error: authMessage ?? "We could not send that reset email. Check your email and SMTP settings."
    };
  }
}
