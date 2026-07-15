import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/AuthShell";
import { AuthExperience } from "@/components/AuthExperience";
import type { DemoRole } from "@/lib/demo-session";

function getLoginRole(role?: string, next?: string): DemoRole {
  if (role === "manager" || role === "company_admin" || role === "super_admin") {
    return role;
  }

  if (next?.startsWith("/manager")) {
    return "manager";
  }

  if (next?.startsWith("/company")) {
    return "company_admin";
  }

  return "employee";
}

function getLoginCopyKey(next?: string, role?: string) {
  if (role === "super_admin" || next?.startsWith("/admin")) {
    return "owner";
  }

  if (role === "manager" || next?.startsWith("/manager")) {
    return "manager";
  }

  if (role === "company_admin" || next?.startsWith("/company")) {
    return "company";
  }

  return "employee";
}

export default async function LoginPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ invite?: string; error?: string; next?: string; role?: string }>;
}) {
  const { locale } = await params;
  const { invite, error, next, role } = await searchParams;
  const initialRole = getLoginRole(role, next);
  const copyKey = getLoginCopyKey(next, role);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: `auth.login.${copyKey}` });

  return (
    <AuthShell
      eyebrow={t("eyebrow")}
      locale={locale}
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <AuthExperience
        authError={error}
        initialRole={initialRole}
        inviteToken={invite}
        key={`login-${initialRole}-${invite ?? ""}-${next ?? ""}`}
        mode="login"
        targetPath={next}
      />
    </AuthShell>
  );
}
