import type { ReactNode } from "react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/BrandLogo";
import { GoogleTranslateWidget } from "@/components/GoogleTranslateWidget";
import { PublicMobileNav } from "@/components/PublicMobileNav";
import { StickyNav } from "@/components/ui/StickyNav";
import { Button } from "@/components/ui/Button";
import { getLocalizedDashboardHref, localizePublicHref, publicNavLinks } from "@/lib/navigation/public-nav";
import { getSiteContentOverrides, pickSiteContentText } from "@/lib/site-content";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function localizeHref(href: string, locale: string) {
  return localizePublicHref(href, locale);
}

async function getPublicUserState(locale: string) {
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
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle<{ first_name: string; last_name: string }>();
    const fallbackName = user.email?.split("@")[0]?.replace(/[._-]+/g, " ") ?? "there";
    const name = profile?.first_name?.trim() || fallbackName;

    return {
      name,
      dashboardHref: getLocalizedDashboardHref(locale)
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
  const locale = localeOverride ?? await getLocale();
  const signedInUser = await getPublicUserState(locale);
  const nav = await getTranslations({ locale, namespace: "nav" });
  const footer = await getTranslations({ locale, namespace: "footer" });
  const home = await getTranslations({ locale, namespace: "home" });
  const overrides = await getSiteContentOverrides("home", locale);
  const cmsText = (key: string, fallback: string) => pickSiteContentText(overrides, fallback, key);
  const footerTitle = cmsText("finalCtaTitle", footer("title"));
  const footerCopy = cmsText("finalCtaCopy", footer("copy"));
  const footerCtaLabel = cmsText("finalCtaButtonLabel", home("finalCtaButtonLabel"));
  const footerCtaHref = localizeHref(cmsText("finalCtaButtonHref", home("finalCtaButtonHref")), locale);
  const localizedCtaHref = localizeHref(ctaHref, locale);
  const localizedNavLinks = publicNavLinks.map((link) => ({
    href: localizeHref(link.href, locale),
    label: nav(link.labelKey)
  }));
  const primaryNavLabel = signedInUser
    ? nav("openDashboard")
    : ctaLabel === "Book a demo"
      ? nav("bookDemo")
      : ctaLabel;
  const primaryNavHref = signedInUser ? signedInUser.dashboardHref : localizedCtaHref;

  return (
    <>
      <StickyNav>
        <div className="gt-container gt-navbar-inner">
          <div className="gt-navbar-brand">
            <BrandLogo href={`/${locale}`} />
          </div>
          <nav className="gt-navbar-links" aria-label="Main navigation">
            {localizedNavLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className={`gt-navbar-actions${signedInUser ? " signed-in" : ""}`}>
            {signedInUser ? (
              <>
                <Link className="gt-navbar-user-link" href={primaryNavHref}>{nav("hi", { name: signedInUser.name })}</Link>
                <Button href={primaryNavHref} variant="primary">
                  {nav("openDashboard")}
                </Button>
                <GoogleTranslateWidget />
                <Link href="/auth/signout">{nav("signOut")}</Link>
              </>
            ) : (
              <>
                <Link className="gt-navbar-login" href={localizeHref("/login", locale)}>{nav("login")}</Link>
                <Button href={localizedCtaHref} variant="primary">
                  {ctaLabel === "Book a demo" ? nav("bookDemo") : ctaLabel}
                </Button>
                <GoogleTranslateWidget />
              </>
            )}
          </div>
          <PublicMobileNav
            links={localizedNavLinks}
            menuLabel={nav("menu")}
            closeLabel={nav("closeMenu")}
            signedIn={Boolean(signedInUser)}
            primaryLabel={primaryNavLabel}
            primaryHref={primaryNavHref}
            secondaryLabel={signedInUser ? undefined : nav("login")}
            secondaryHref={signedInUser ? undefined : localizeHref("/login", locale)}
            signOutLabel={nav("signOut")}
          />
        </div>
      </StickyNav>

      <main>
      {children}

      <section className="gt-final-cta" aria-labelledby="gt-final-cta-title">
        <div className="gt-container gt-final-cta-inner">
          <h2 id="gt-final-cta-title">{footerTitle}</h2>
          <p>{footerCopy}</p>
          {!signedInUser && footerCtaLabel ? (
            <Button href={footerCtaHref} variant="primary" size="hero" className="gt-final-cta-button">
              {footerCtaLabel}
            </Button>
          ) : null}
        </div>
      </section>

      <footer className="gt-footer">
        <div className="gt-container gt-footer-inner">
          <div className="gt-footer-grid">
            <div className="gt-footer-brand">
              <BrandLogo href={`/${locale}`} />
              <a href="mailto:info@geth.pro">info@geth.pro</a>
            </div>
            <div className="gt-footer-col">
              <span className="gt-footer-col-title">{nav("pricing")}</span>
              <Link href={localizeHref("/pricing", locale)}>{nav("pricing")}</Link>
              <Link href={localizeHref("/resources", locale)}>{nav("support")}</Link>
              <Link href={localizeHref("/vision-mission", locale)}>{nav("visionMission")}</Link>
            </div>
            <div className="gt-footer-col">
              <span className="gt-footer-col-title">{footer("privacy")}</span>
              <Link href={localizeHref("/privacy", locale)}>{footer("privacy")}</Link>
              <Link href={localizeHref("/terms", locale)}>{footer("terms")}</Link>
              <Link href={localizeHref("/resources", locale)}>{footer("security")}</Link>
            </div>
          </div>
          <div className="gt-footer-bottom">
            <small>&copy; 2026 GETH</small>
            <GoogleTranslateWidget />
          </div>
        </div>
      </footer>
      </main>
    </>
  );
}
