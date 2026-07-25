import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/BrandLogo";
import { defaultLocale } from "@/i18n/routing";

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

  return (
    <main className="auth-page">
      <section className="auth-story">
        <BrandLogo tagline />
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="auth-bullets">
          <span>{t("recognition")}</span>
          <span>{t("private")}</span>
          <span>{t("teams")}</span>
        </div>
      </section>

      <section className="auth-panel">{children}</section>
    </main>
  );
}
