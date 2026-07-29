import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { bootstrapProfile, InvitationBootstrapError } from "@/lib/auth/bootstrap-profile";
import { normalizeAppRole, type AppRole } from "@/lib/auth/roles";

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

function getExpectedRole(value: unknown): AppRole | null {
  if (value === "employee" || value === "manager" || value === "company_admin" || value === "platform_admin" || value === "super_admin") {
    return value;
  }

  return null;
}

function rolesAreCompatible(expectedRole: AppRole, actualRole: AppRole) {
  if (expectedRole === "super_admin") {
    return actualRole === "super_admin" || actualRole === "platform_admin";
  }

  return expectedRole === actualRole;
}

function getRoleMismatchRedirect(expectedRole: AppRole) {
  if (expectedRole === "super_admin" || expectedRole === "platform_admin") {
    return `/owner?error=role_mismatch`;
  }

  return `/login?error=role_mismatch&role=${expectedRole}`;
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
    const { redirectTo, invitationApplied, role } = await bootstrapProfile(user, inviteToken);
    const requestedRole = getExpectedRole(expectedRole);
    const actualRole = normalizeAppRole(role);

    if (!inviteToken && requestedRole && !rolesAreCompatible(requestedRole, actualRole)) {
      return jsonWithCookies(
        response,
        {
          redirectTo: getRoleMismatchRedirect(requestedRole),
          error: "role_mismatch",
          actualRole,
          expectedRole: requestedRole
        },
        403
      );
    }

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
