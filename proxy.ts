import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getRouteForAppRole, normalizeAppRole, type AppRole } from "@/lib/auth/roles";
import { DEMO_SESSION_COOKIE, type DemoRole } from "@/lib/demo-session";
import { defaultLocale, getLocaleFromPathname, stripLocaleFromPathname, type AppLocale } from "@/i18n/routing";

const PUBLIC_EXACT_PATHS = new Set(["/", "/login", "/signup", "/cards", "/pricing", "/resources", "/book-demo"]);
const PUBLIC_PREFIXES = ["/claim-card", "/invite"];
const NON_LOCALIZED_PREFIXES = ["/api", "/auth", "/_next"];

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

function shouldSkipLocaleRedirect(pathname: string) {
  if (NON_LOCALIZED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }

  return /\.[a-z0-9]+$/i.test(pathname);
}

function localizePath(path: string, locale: AppLocale) {
  if (path === "/") {
    return `/${locale}`;
  }

  return `/${locale}${path}`;
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

function buildLoginRedirect(request: NextRequest, source: NextResponse, locale: AppLocale, error?: string) {
  const redirectUrl = new URL(localizePath("/login", locale), request.url);

  if (error) {
    redirectUrl.searchParams.set("error", error);
  }

  const redirectResponse = NextResponse.redirect(redirectUrl);
  copyCookies(source, redirectResponse);
  return redirectResponse;
}

function buildRoleRedirect(request: NextRequest, source: NextResponse, role: AppRole, locale: AppLocale) {
  const redirectResponse = NextResponse.redirect(new URL(localizePath(getRouteForAppRole(role), locale), request.url));
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

function getLocaleRequestHeaders(request: NextRequest, locale: AppLocale) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-next-intl-locale", locale);
  return requestHeaders;
}

function nextWithLocale(request: NextRequest, locale: AppLocale) {
  return NextResponse.next({
    request: {
      headers: getLocaleRequestHeaders(request, locale)
    }
  });
}

export async function proxy(request: NextRequest) {
  const originalPathname = request.nextUrl.pathname;
  const currentLocale = getLocaleFromPathname(originalPathname);

  if (!currentLocale && !shouldSkipLocaleRedirect(originalPathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = localizePath(originalPathname, defaultLocale);
    return NextResponse.redirect(redirectUrl);
  }

  const locale = currentLocale ?? defaultLocale;

  if (!hasSupabaseServerConfig()) {
    return nextWithLocale(request, locale);
  }

  const pathname = stripLocaleFromPathname(originalPathname);

  if (isPublicPath(pathname)) {
    return nextWithLocale(request, locale);
  }

  const protectedRule = getProtectedRouteRule(pathname);
  if (!protectedRule) {
    return nextWithLocale(request, locale);
  }

  const response = NextResponse.next({
    request: {
      headers: getLocaleRequestHeaders(request, locale)
    }
  });

  const demoRole = canUseDemoMiddlewareBypass() ? getDemoRole(request) : null;
  if (demoRole) {
    if (!protectedRule.allowedRoles.includes(demoRole)) {
      return buildRoleRedirect(request, response, demoRole, locale);
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
    return buildLoginRedirect(request, response, locale);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: AppRole }>();

  if (profileError || !profile) {
    const repairUrl = new URL("/auth/repair-profile", request.url);
    repairUrl.searchParams.set("next", originalPathname);
    const repairResponse = NextResponse.redirect(repairUrl);
    copyCookies(response, repairResponse);
    return repairResponse;
  }

  const actualRole = normalizeAppRole(profile.role);
  if (!protectedRule.allowedRoles.includes(actualRole)) {
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      const signoutUrl = new URL("/auth/signout", request.url);
      signoutUrl.searchParams.set("next", `${localizePath("/login", locale)}?error=admin_required`);
      const signoutResponse = NextResponse.redirect(signoutUrl);
      copyCookies(response, signoutResponse);
      return signoutResponse;
    }

    return buildRoleRedirect(request, response, actualRole, locale);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|csv)$).*)"]
};
