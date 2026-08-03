import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/AuthShell";
import { AuthExperience } from "@/components/AuthExperience";
import { loadInviteSignupPrefill } from "@/lib/auth/invite-signup-prefill";
import type { DemoRole } from "@/lib/demo-session";

function getSignupRole(role?: string): DemoRole {
  if (role === "manager" || role === "company_admin") {
    return role;
  }

  return "employee";
}

function getSignupCopyKey(role?: string, invite?: string) {
  if (invite) {
    return "invite";
  }

  if (role === "company_admin") {
    return "company";
  }

  if (role === "manager") {
    return "manager";
  }

  return "employee";
}

export default async function SignUpPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ invite?: string; error?: string; role?: string; next?: string }>;
}) {
  const { locale } = await params;
  const { invite, error, role, next } = await searchParams;
  const invitePrefill = invite ? await loadInviteSignupPrefill(invite) : null;
  const initialRole = invitePrefill?.role ?? getSignupRole(role);
  const copyKey = getSignupCopyKey(role, invite);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: `auth.signup.${copyKey}` });

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
        invitePrefill={invitePrefill ?? undefined}
        inviteToken={invite}
        key={`signup-${initialRole}-${invite ?? ""}-${next ?? ""}`}
        mode="signup"
        targetPath={next}
      />
    </AuthShell>
  );
}
