import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolve auth user id by email. Profiles lookup is fast; generateLink is the fallback.
 */
export async function resolveAuthUserIdByEmail(admin: SupabaseClient, email: string) {
  const normalized = email.trim().toLowerCase();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", normalized)
    .maybeSingle<{ id: string }>();

  if (!profileError && profile?.id) {
    return { userId: profile.id, error: null as string | null };
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: normalized
  });

  if (error || !data.user?.id) {
    return {
      userId: null,
      error: error?.message ?? "No account was found for that email."
    };
  }

  return { userId: data.user.id, error: null };
}
