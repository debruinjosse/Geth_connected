import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { resolveAuthCallbackRedirect } from "@/lib/auth/complete-auth-callback";

function buildSupabaseResponse(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Parameters<typeof response.cookies.set>[2] }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  return { response, supabase };
}

function jsonWithCookies(base: NextResponse, body: Record<string, string>, status = 200) {
  const response = NextResponse.json(body, { status });
  base.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });
  return response;
}

export async function POST(request: NextRequest) {
  const { inviteToken, targetPath, expectedRole } = (await request.json().catch(() => ({}))) as {
    inviteToken?: string | null;
    targetPath?: string | null;
    expectedRole?: string | null;
  };
  const { response, supabase } = buildSupabaseResponse(request);

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonWithCookies(response, { redirectTo: "/login?error=auth_callback_failed" }, 401);
  }

  try {
    const { redirectTo } = await resolveAuthCallbackRedirect(user, {
      inviteToken,
      targetPath,
      expectedRole,
      origin: request.url
    });

    return jsonWithCookies(response, { redirectTo });
  } catch {
    return jsonWithCookies(response, { redirectTo: "/login?error=profile_bootstrap_failed" }, 400);
  }
}
