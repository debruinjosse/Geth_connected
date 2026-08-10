import type { SupabaseClient } from "@supabase/supabase-js";

export async function findAuthUserIdByEmail(admin: SupabaseClient, email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  let page = 1;
  const perPage = 100;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    const match = data.users.find((candidate) => candidate.email?.trim().toLowerCase() === normalized);
    if (match?.id) {
      return match.id;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }

  return null;
}
