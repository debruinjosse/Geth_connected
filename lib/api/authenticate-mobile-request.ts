import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

/**
 * Verifies a Flutter (or any non-browser) client's request against Supabase Auth.
 *
 * Mobile clients have no cookies, so they can't use `lib/supabase/server.ts`'s cookie-based
 * client (and `proxy.ts`'s route matcher excludes `/api/*` anyway, so nothing upstream protects
 * these routes). Instead, the client sends its Supabase session's access token as a bearer token;
 * this builds a Supabase client carrying that token as the request's `Authorization` header (so
 * RLS-scoped queries made with it are correctly scoped to that user, the same way the cookie-based
 * client is for web), and verifies the token via `auth.getUser(token)`.
 */
export type MobileAuthResult =
  | { ok: true; supabase: SupabaseClient; user: User }
  | { ok: false; status: number; error: string };

export async function authenticateMobileRequest(request: Request): Promise<MobileAuthResult> {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
  const match = authHeader?.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();

  if (!token) {
    return { ok: false, status: 401, error: "Missing or malformed Authorization header. Expected: Bearer <token>." };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { ok: false, status: 500, error: "Supabase is not configured on the server." };
  }

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { ok: false, status: 401, error: "Invalid or expired session." };
  }

  return { ok: true, supabase, user: data.user };
}
