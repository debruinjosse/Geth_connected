import type { ReactNode } from "react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { LandingEffects } from "@/components/landing/LandingEffects";
import { PublicNav } from "@/components/landing/PublicNav";
import { getLocalizedDashboardHref, localizePublicHref, publicNavLinks } from "@/lib/navigation/public-nav";
import type { AppLocale } from "@/i18n/routing";
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

    return { dashboardHref: getLocalizedDashboardHref(locale) };
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
  const locale = localeOverride ?? (await getLocale());
  const signedInUser = await getPublicUserState(locale);
  const nav = await getTranslations({ locale, namespace: "nav" });
  const lp = await getTranslations({ locale, namespace: "landingV2" });
  const overrides = await getSiteContentOverrides("home", locale);
  const cmsText = (key: string, fallback: string) => pickSiteContentText(overrides, fallback, key);

  const navLabelKeys = {
    howItWorks: "nHow",
    cards: "nCards",
    pricing: "nPricing",
    support: "nSupport",
    visionMission: "nVision"
  } as const;
  const links = publicNavLinks.map((link) => ({
    href: localizeHref(link.href, locale),
    label: lp(navLabelKeys[link.labelKey])
  }));
  const demoLabel = ctaLabel === "Book a demo" ? lp("nDemo") : ctaLabel;
  const demoHref = localizeHref(ctaHref, locale);
  const primaryLabel = signedInUser ? lp("openDashboard") : demoLabel;
  const primaryHref = signedInUser ? signedInUser.dashboardHref : demoHref;
  const secondaryLabel = signedInUser ? lp("signOut") : lp("nLogin");
  const secondaryHref = signedInUser ? "/auth/signout" : localizeHref("/login", locale);

  const ctaEyebrow = lp("ctaEye");
  const ctaTitle = lp("ctaT");
  const ctaCopy = lp("ctaP");
  const ctaButtonLabel = lp("nDemo");
  const ctaButtonHref = localizeHref(cmsText("finalCtaButtonHref", "/book-demo"), locale);

  const homeHref = `/${locale}`;
  const footerColumns = [
    {
      title: lp("fP"),
      links: [
        { href: localizeHref("/#how-it-works", locale), label: lp("nHow") },
        { href: localizeHref("/#cards", locale), label: lp("nCards") },
        { href: localizeHref("/pricing", locale), label: lp("nPricing") }
      ]
    },
    {
      title: lp("fC"),
      links: [
        { href: localizeHref("/vision-mission", locale), label: lp("nVision") },
        { href: localizeHref("/resources", locale), label: lp("nSupport") },
        { href: demoHref, label: lp("nDemo") }
      ]
    },
    {
      title: lp("fL"),
      links: [
        { href: localizeHref("/privacy", locale), label: lp("fPriv") },
        { href: localizeHref("/terms", locale), label: lp("fTerms") },
        { href: localizeHref("/resources", locale), label: lp("fSec") }
      ]
    }
  ];

  return (
    <>
      <PublicNav
        locale={locale as AppLocale}
        homeHref={homeHref}
        links={links}
        secondaryLabel={secondaryLabel}
        secondaryHref={secondaryHref}
        primaryLabel={primaryLabel}
        primaryHref={primaryHref}
        menuLabel={nav("menu")}
        closeLabel={nav("closeMenu")}
        languageLabel={lp("language")}
        mainNavLabel={lp("mainNav")}
      />

      <main id="top">
        <div className="lp">{children}</div>

        <section className="lp lp-cta" id="demo" aria-labelledby="lp-cta-title">
          <div className="lp-wrap">
            <div className="lp-cta-box lp-rv">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="lp-bird-mark" src="/landing/badges/geth_constellation_bird_mark.svg" alt="" />
              <span className="lp-eyebrow">{ctaEyebrow}</span>
              <h2 id="lp-cta-title">{ctaTitle}</h2>
              <p>{ctaCopy}</p>
              <div className="lp-cta-row">
                {!signedInUser && ctaButtonLabel ? (
                  <Button href={ctaButtonHref} variant="gold" arrow>
                    {ctaButtonLabel}
                  </Button>
                ) : null}
                <Button href={localizeHref("/pricing", locale)} variant="ghost">
                  {lp("mPrice")}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp lp-footer">
        <div className="lp-wrap">
          <div className="lp-f-grid">
            <div className="lp-f-brand">
              <Link href={homeHref} className="lp-brand" aria-label="GETH®">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/landing/geth-crest.svg" alt="" />
                <b>
                  GETH<sup>®</sup>
                </b>
              </Link>
              <p>{lp("fTag")}</p>
              <a className="lp-mail" href="mailto:info@geth.pro">
                info@geth.pro
              </a>
            </div>
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h5>{column.title}</h5>
                <ul>
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.href}-${link.label}`}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="lp-f-bottom">
            <span>© 2026 GETH®</span>
            <span>{lp("fReg")}</span>
          </div>
        </div>
      </footer>
      <LandingEffects />
    </>
  );
}
