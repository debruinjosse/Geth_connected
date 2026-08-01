"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveAuthUserIdByEmail } from "@/lib/auth/resolve-auth-user-id";

export async function setPasswordDirectAction(input: { email: string; password: string; confirmPassword: string }) {
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
