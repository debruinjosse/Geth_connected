import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthExperience } from "@/components/AuthExperience";
import { AuthShell } from "@/components/AuthShell";

export default async function OwnerLoginPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "auth.login.owner" });

  return (
    <AuthShell eyebrow={t("eyebrow")} locale={locale} title={t("title")} subtitle={t("subtitle")}>
      <AuthExperience
        authError={error}
        initialRole="super_admin"
        key="owner-login"
        mode="login"
        targetPath="/admin"
      />
    </AuthShell>
  );
}
