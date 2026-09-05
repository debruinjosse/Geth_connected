"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveAuthUserIdByEmail } from "@/lib/auth/resolve-auth-user-id";
import type { ActionResult } from "@/lib/actions/types";

/**
 * "Forgot password" form handler — sets a new password for the account matching `input.email`.
 *
 * Public — no auth required to call (that's the point: the user isn't logged in yet).
 *
 * // SECURITY (flagged, not fixed — tracked separately, see chore/cleanup-and-consistency plan):
 * // This does NOT verify that the caller owns `email` before changing its password — there is
 * // no OTP/recovery-token check, only the email address itself. As shipped, anyone who knows a
 * // user's email can take over that account through this form. Do not copy this pattern
 * // elsewhere; fix by requiring a verified recovery token (e.g. the `app/auth/verify` flow)
 * // before calling `admin.auth.admin.updateUserById`.
 */
export async function setPasswordDirectAction(input: {
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const confirmPassword = input.confirmPassword;

  if (!email) {
    return { ok: false as const, error: "Enter your work email." };
  }

  if (!password || password.length < 6) {
    return { ok: false as const, error: "Enter a password with at least 6 characters." };
  }

  if (password !== confirmPassword) {
    return { ok: false as const, error: "Passwords do not match." };
  }

  try {
    const admin = createSupabaseAdminClient();
    const { userId, error: lookupError } = await resolveAuthUserIdByEmail(admin, email);

    if (!userId) {
      return { ok: false as const, error: lookupError ?? "No GETH account was found for that email." };
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      password
    });

    if (updateError) {
      return { ok: false as const, error: updateError.message || "We could not update that password." };
    }

    return { ok: true as const };
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("service role")
        ? "Password reset is not configured on the server yet. Contact support."
        : "We could not update that password. Please try again.";

    return { ok: false as const, error: message };
  }
}
