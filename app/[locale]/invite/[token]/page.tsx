import { Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/AuthShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

type InvitePageParams = {
  locale: string;
  token: string;
};

type InviteSearchParams = {
  status?: string;
  reason?: string;
  next?: string;
};

function getLocalizedRole(role: string, locale: string) {
  const labels: Record<string, Record<string, string>> = {
    en: {
      company_admin: "company admin",
      manager: "manager",
      employee: "employee"
    },
    nl: {
      company_admin: "bedrijfsbeheerder",
      manager: "manager",
      employee: "medewerker"
    }
  };

  return labels[locale]?.[role] ?? role.replace("_", " ");
}

export default async function InvitePage({
  params,
  searchParams
}: {
  params: Promise<InvitePageParams>;
  searchParams: Promise<InviteSearchParams>;
}) {
  const { locale, token } = await params;
  const { status, reason, next } = await searchParams;
  const t = await getTranslations({ locale, namespace: "auth.invite" });
  const dateLocale = locale === "nl" ? "nl-NL" : "en";

  const getReasonCopy = (reasonKey?: string) => {
    switch (reasonKey) {
      case "invite_email_mismatch":
        return t("reasonInviteEmailMismatch");
      case "invite_expired":
        return t("reasonInviteExpired");
      case "invite_revoked":
        return t("reasonInviteRevoked");
      case "invite_not_found":
        return t("reasonInviteNotFound");
      default:
        return t("reasonDefault");
    }
  };

  if (!hasSupabaseServerConfig()) {
    return (
      <AuthShell
        locale={locale}
        eyebrow={t("eyebrow")}
        title={t("noSupabaseTitle")}
        subtitle={t("noSupabaseSubtitle")}
      >
        <Card className="lp-auth-card">
          <p className="lp-sub">{t("noSupabaseCopy")}</p>
          <Button href={`/${locale}/login`}>{t("backToLogin")}</Button>
        </Card>
      </AuthShell>
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: invitation } = await admin
    .from("invitations")
    .select("id, email, role, status, expires_at, company:companies(company_name), team:teams(name)")
    .eq("token", token)
    .maybeSingle<{
      id: string;
      email: string;
      role: string;
      status: "pending" | "accepted" | "expired" | "revoked";
      expires_at: string;
      company: { company_name: string } | Array<{ company_name: string }> | null;
      team: { name: string } | Array<{ name: string }> | null;
    }>();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const company = Array.isArray(invitation?.company) ? invitation?.company[0] : invitation?.company;
  const team = Array.isArray(invitation?.team) ? invitation?.team[0] : invitation?.team;
  const invitedEmail = invitation?.email ?? "Unknown email";
  const localizedRole = invitation ? getLocalizedRole(invitation.role, locale) : "";
  const sessionEmail = user?.email?.trim().toLowerCase();
  const inviteEmail = invitation?.email?.trim().toLowerCase();
  const loggedInWithMatchingEmail = Boolean(sessionEmail && inviteEmail && sessionEmail === inviteEmail);
  const isAccepted = status === "accepted" || invitation?.status === "accepted";
  const isError = status === "error";
  const expiryLabel = invitation
    ? new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium" }).format(new Date(invitation.expires_at))
    : "";

  return (
    <AuthShell
      locale={locale}
      eyebrow={t("eyebrow")}
      title={isAccepted ? t("titleAccepted") : t("title")}
      subtitle={isAccepted ? t("subtitleAccepted") : t("subtitle")}
    >
      <Card className="lp-auth-card">
        {invitation ? (
          <>
            <Pill tone="gold">{company?.company_name ?? t("companyWorkspaceFallback")}</Pill>
            <h2 style={{ marginTop: 18 }}>{company?.company_name ?? t("companyInviteFallback")}</h2>
            <p className="lp-sub">
              {t.rich("inviteSummary", {
                email: invitedEmail,
                role: localizedRole,
                teamSuffix: team?.name ? t("inviteSummaryTeamSuffix", { teamName: team.name }) : t("inviteSummaryNoTeamSuffix"),
                strong: (chunks) => <strong>{chunks}</strong>
              })}
            </p>
          </>
        ) : (
          <Alert tone="error">{t("tokenNotFound")}</Alert>
        )}

        {isAccepted ? (
          <div className="lp-stack">
            <Alert tone="success">{t("profileAttached")}</Alert>
            <Button href={next || `/${locale}/employee`} arrow block>
              {t("openWorkspace")}
            </Button>
          </div>
        ) : isError ? (
          <div className="lp-stack">
            <Alert tone="error">{getReasonCopy(reason)}</Alert>
            <div className="lp-invite-actions">
              <Button variant="ghost" href={`/${locale}/login?invite=${token}`}>
                {t("tryLoginAgain")}
              </Button>
              <Button variant="ghost" href={`/${locale}/signup?invite=${token}`}>
                {t("createAccount")}
              </Button>
            </div>
          </div>
        ) : invitation ? (
          <div className="lp-stack">
            <div className="lp-invite-points">
              <strong>{t("invitationDetails")}</strong>
              <span>
                <Mail />
                {t("invitedEmail", { email: invitedEmail })}
              </span>
              <span>{t("roleLine", { role: localizedRole })}</span>
              <span>{t("teamLine", { team: team?.name ?? t("teamAssignLater") })}</span>
              <small className="lp-hint">{t("expiresOn", { date: expiryLabel })}</small>
            </div>

            {user ? (
              loggedInWithMatchingEmail ? (
                <Button href={`/auth/callback?invite=${token}`} arrow block>
                  {t("acceptInvitation")}
                </Button>
              ) : (
                <Alert tone="error">{t("loggedInMismatch", { sessionEmail: user.email ?? "", invitedEmail })}</Alert>
              )
            ) : (
              <div className="lp-invite-actions">
                <Button href={`/${locale}/signup?invite=${token}`} arrow>
                  {t("createAccount")}
                </Button>
                <Button variant="ghost" href={`/${locale}/login?invite=${token}`}>
                  {t("logIn")}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="lp-stack">
            <Alert tone="error">{t("noLongerAvailable")}</Alert>
            <Button variant="ghost" href={`/${locale}/login`}>
              {t("backToLogin")}
            </Button>
          </div>
        )}
      </Card>
    </AuthShell>
  );
}
