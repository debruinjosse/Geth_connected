import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { bootstrapProfile, InvitationBootstrapError } from "@/lib/auth/bootstrap-profile";

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
  const { inviteToken, targetPath } = (await request.json().catch(() => ({}))) as {
    inviteToken?: string | null;
    targetPath?: string | null;
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
    const { redirectTo, invitationApplied } = await bootstrapProfile(user, inviteToken);
    const safeTargetPath =
      targetPath && targetPath.startsWith("/") && !targetPath.startsWith("//") && !targetPath.startsWith("/api") && !targetPath.startsWith("/auth")
        ? targetPath
        : "";
    const finalRedirect = safeTargetPath === redirectTo || safeTargetPath.startsWith(`${redirectTo}/`) ? safeTargetPath : redirectTo;

    if (inviteToken && invitationApplied) {
      const inviteUrl = new URL(`/invite/${inviteToken}`, request.url);
      inviteUrl.searchParams.set("status", "accepted");
      inviteUrl.searchParams.set("next", finalRedirect);
      return jsonWithCookies(response, { redirectTo: `${inviteUrl.pathname}${inviteUrl.search}` });
    }

    return jsonWithCookies(response, { redirectTo: finalRedirect });
  } catch (error) {
    if (inviteToken && error instanceof InvitationBootstrapError) {
      const inviteUrl = new URL(`/invite/${inviteToken}`, request.url);
      inviteUrl.searchParams.set("status", "error");
      inviteUrl.searchParams.set("reason", error.code.toLowerCase());
      return jsonWithCookies(response, { redirectTo: `${inviteUrl.pathname}${inviteUrl.search}` }, 400);
    }

    return jsonWithCookies(response, { redirectTo: "/login?error=profile_bootstrap_failed" }, 400);
  }
}
