import type { ReactNode } from "react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/BrandLogo";
import { GoogleTranslateWidget } from "@/components/GoogleTranslateWidget";
import { PublicMobileNav } from "@/components/PublicMobileNav";
import { getRouteForAppRole, normalizeAppRole } from "@/lib/auth/roles";
import { localizePublicHref, publicNavLinks } from "@/lib/navigation/public-nav";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function localizeHref(href: string, locale: string) {
  return localizePublicHref(href, locale);
}

async function getPublicUserState() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, role")
      .eq("id", user.id)
      .maybeSingle<{ first_name: string; last_name: string; role: string }>();

    const role = normalizeAppRole(profile?.role);
    const fallbackName = user.email?.split("@")[0]?.replace(/[._-]+/g, " ") ?? "there";
    const name = profile?.first_name?.trim() || fallbackName;

    return {
      name,
      dashboardHref: getRouteForAppRole(role)
    };
  } catch {
    return null;
  }
}

export async function PublicSiteChrome({
  children,
  ctaLabel = "Book a demo",
  ctaHref = "/book-demo",
  locale: localeOverride
}: {
  children: ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
  locale?: string;
}) {
  const signedInUser = await getPublicUserState();
  const locale = localeOverride ?? await getLocale();
  const nav = await getTranslations({ locale, namespace: "nav" });
  const footer = await getTranslations({ locale, namespace: "footer" });
  const home = await getTranslations({ locale, namespace: "home" });
  const localizedCtaHref = localizeHref(ctaHref, locale);
  const localizedNavLinks = publicNavLinks.map((link) => ({
    href: localizeHref(link.href, locale),
    label: nav(link.labelKey)
  }));
  const localizedDashboardHref = signedInUser ? localizeHref(signedInUser.dashboardHref, locale) : undefined;

  return (
    <main>
      <header className="site-header">
        <div className="pageContainer site-header-inner">
          <div className="site-header-brand">
            <BrandLogo href={`/${locale}`} />
          </div>
          <nav className="site-nav" aria-label="Main navigation">
            {localizedNavLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="site-actions">
            {signedInUser ? (
              <>
                <Link className="site-user-link" href={localizedDashboardHref ?? `/${locale}`}>{nav("hi", { name: signedInUser.name })}</Link>
                <Link className="btn btn-primary site-primary-cta" href={localizedDashboardHref ?? `/${locale}`}>
                  {nav("openDashboard")}
                </Link>
                <GoogleTranslateWidget />
                <Link href="/auth/signout">{nav("signOut")}</Link>
              </>
            ) : (
              <>
                <Link href={localizeHref("/login", locale)}>{nav("login")}</Link>
                <Link className="btn btn-primary site-primary-cta" href={localizedCtaHref}>
                  {ctaLabel === "Book a demo" ? nav("bookDemo") : ctaLabel}
                </Link>
                <GoogleTranslateWidget />
              </>
            )}
          </div>
          <PublicMobileNav
            links={localizedNavLinks}
            loginLabel={nav("login")}
            loginHref={localizeHref("/login", locale)}
            bookDemoLabel={nav("bookDemo")}
            bookDemoHref={localizedCtaHref}
            registerCompanyLabel={home("registerCompany")}
            registerCompanyHref={localizeHref("/signup?role=company_admin", locale)}
            menuLabel={nav("menu")}
            closeLabel={nav("closeMenu")}
            signedIn={Boolean(signedInUser)}
            dashboardLabel={nav("openDashboard")}
            dashboardHref={localizedDashboardHref}
            signOutLabel={nav("signOut")}
          />
        </div>
      </header>

      {children}

      <section className="footer-banner landingFooter">
        <div className="pageContainer landingFooterInner">
          <div className="landingFooterCopy">
            <div className="eyebrow">{footer("banner")}</div>
            <h2>{footer("title")}</h2>
            <p>{footer("copy")}</p>
          </div>
          <footer className="site-footer">
            <div>
              <BrandLogo href={`/${locale}`} />
              <small>info@geth.pro</small>
            </div>
            <div className="footer-links">
              <Link href={localizeHref("/pricing", locale)}>{nav("pricing")}</Link>
              <Link href={localizeHref("/book-demo", locale)}>{nav("bookDemo")}</Link>
              <Link href={localizeHref("/resources", locale)}>{nav("support")}</Link>
              <Link href={localizeHref("/vision-mission", locale)}>{nav("visionMission")}</Link>
            </div>
            <div className="footer-meta">
              <Link href={localizeHref("/privacy", locale)}>{footer("privacy")}</Link>
              <Link href={localizeHref("/terms", locale)}>{footer("terms")}</Link>
              <Link href={localizeHref("/resources", locale)}>{footer("security")}</Link>
            </div>
            <div className="footer-meta">
              <small>Registered 2026</small>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}
