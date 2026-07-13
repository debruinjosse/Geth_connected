import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getRouteForAppRole, normalizeAppRole, type AppRole } from "@/lib/auth/roles";
import { DEMO_SESSION_COOKIE, type DemoRole } from "@/lib/demo-session";

const PUBLIC_EXACT_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/cards",
  "/pricing",
  "/resources",
  "/book-demo"
]);

const PUBLIC_PREFIXES = ["/claim-card", "/auth/callback", "/auth/repair-profile", "/invite"];

const PROTECTED_ROUTE_RULES: Array<{
  prefix: string;
  allowedRoles: AppRole[];
}> = [
  { prefix: "/employee", allowedRoles: ["employee"] },
  { prefix: "/manager", allowedRoles: ["manager"] },
  { prefix: "/company", allowedRoles: ["company_admin"] },
  { prefix: "/admin", allowedRoles: ["platform_admin", "super_admin"] },
  { prefix: "/dashboard", allowedRoles: ["employee", "manager", "company_admin", "platform_admin", "super_admin"] }
];

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function canUseDemoMiddlewareBypass() {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true";
}

function isPublicPath(pathname: string) {
  if (PUBLIC_EXACT_PATHS.has(pathname)) {
    return true;
  }

  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function getProtectedRouteRule(pathname: string) {
  return PROTECTED_ROUTE_RULES.find((rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) ?? null;
}

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
}

function buildLoginRedirect(request: NextRequest, source: NextResponse, error?: string) {
  const redirectUrl = new URL("/login", request.url);

  if (error) {
    redirectUrl.searchParams.set("error", error);
  }

  const redirectResponse = NextResponse.redirect(redirectUrl);
  copyCookies(source, redirectResponse);
  return redirectResponse;
}

function buildRoleRedirect(request: NextRequest, source: NextResponse, role: AppRole) {
  const redirectResponse = NextResponse.redirect(new URL(getRouteForAppRole(role), request.url));
  copyCookies(source, redirectResponse);
  return redirectResponse;
}

function getDemoRole(request: NextRequest) {
  const rawSession = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  if (!rawSession) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(rawSession)) as { role?: DemoRole; createdAt?: string };
    if (!parsed.role || !parsed.createdAt) return null;
    return normalizeAppRole(parsed.role);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const protectedRule = getProtectedRouteRule(pathname);
  if (!protectedRule) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const demoRole = canUseDemoMiddlewareBypass() ? getDemoRole(request) : null;
  if (demoRole) {
    if (!protectedRule.allowedRoles.includes(demoRole)) {
      return buildRoleRedirect(request, response, demoRole);
    }

    return response;
  }

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
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return buildLoginRedirect(request, response);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: AppRole }>();

  if (profileError || !profile) {
    const repairUrl = new URL("/auth/repair-profile", request.url);
    repairUrl.searchParams.set("next", pathname);
    const repairResponse = NextResponse.redirect(repairUrl);
    copyCookies(response, repairResponse);
    return repairResponse;
  }

  const actualRole = normalizeAppRole(profile.role);
  if (!protectedRule.allowedRoles.includes(actualRole)) {
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      const signoutUrl = new URL("/auth/signout", request.url);
      signoutUrl.searchParams.set("next", "/login?error=admin_required");
      const signoutResponse = NextResponse.redirect(signoutUrl);
      copyCookies(response, signoutResponse);
      return signoutResponse;
    }

    return buildRoleRedirect(request, response, actualRole);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"]
};
