import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { bootstrapProfile } from "@/lib/auth/bootstrap-profile";
import { normalizeAppRole } from "@/lib/auth/roles";

function isAllowedNextPath(path: string, role: ReturnType<typeof normalizeAppRole>) {
  if (role === "employee") return path === "/employee" || path.startsWith("/employee/");
  if (role === "manager") return path === "/manager" || path.startsWith("/manager/");
  if (role === "company_admin") return path === "/company" || path.startsWith("/company/");
  if (role === "platform_admin" || role === "super_admin") return path === "/admin" || path.startsWith("/admin/");
  return false;
}

function buildSupabaseResponse(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Parameters<typeof response.cookies.set>[2] }>) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  return { response, supabase };
}

function redirectWithCookies(base: NextResponse, url: URL) {
  const response = NextResponse.redirect(url);
  base.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}

export async function GET(request: NextRequest) {
  const { response, supabase } = buildSupabaseResponse(request);
  const nextPath = request.nextUrl.searchParams.get("next") || "";

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return redirectWithCookies(response, new URL("/login?error=auth_callback_failed", request.url));
  }

  try {
    const result = await bootstrapProfile(user);
    const role = normalizeAppRole(result.role);
    const safeNext = nextPath.startsWith("/") && isAllowedNextPath(nextPath, role) ? nextPath : result.redirectTo;
    return redirectWithCookies(response, new URL(safeNext, request.url));
  } catch {
    return redirectWithCookies(response, new URL("/login?error=profile_bootstrap_failed", request.url));
  }
}
