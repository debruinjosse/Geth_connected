/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { defaultLocale, type AppLocale } from "@/i18n/routing";

/** Two-panel layout for every sign-in / recovery screen: brand story on the left, form card on the right. */
export async function AuthShell({
  title,
  subtitle,
  eyebrow,
  children,
  locale = defaultLocale
}: {
  title: string;
  subtitle: string;
  eyebrow: string;
  children: ReactNode;
  locale?: string;
}) {
  const t = await getTranslations({ locale, namespace: "auth.bullets" });
  const form = await getTranslations({ locale, namespace: "authForm" });
  const lp = await getTranslations({ locale, namespace: "landingV2" });
  const homeHref = `/${locale}`;

  return (
    <main className="lp lp-auth">
      <section className="lp-auth-story">
        <Link href={homeHref} className="lp-brand" aria-label="GETH®">
          <img src="/landing/geth-crest.svg" alt="" />
          <b>
            GETH<sup>®</sup>
          </b>
        </Link>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        <p className="lp-lead">{subtitle}</p>
        <ul className="lp-auth-bullets">
          <li>{t("recognition")}</li>
          <li>{t("private")}</li>
          <li>{t("teams")}</li>
        </ul>
        <img className="lp-auth-mark" src="/landing/badges/geth_constellation_bird_mark.svg" alt="" />
      </section>

      <section className="lp-auth-main">
        <div className="lp-auth-bar">
          <Link href={homeHref} className="lp-auth-back">
            <ArrowLeft aria-hidden="true" />
            {form("backToSite")}
          </Link>
          <LanguageToggle locale={locale as AppLocale} label={lp("language")} />
        </div>
        <div className="lp-auth-center">{children}</div>
      </section>
    </main>
  );
}
