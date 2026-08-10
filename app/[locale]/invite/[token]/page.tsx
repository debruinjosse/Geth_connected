import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/AuthShell";
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
        <div className="auth-card">
          <p className="section-copy">{t("noSupabaseCopy")}</p>
          <Link className="btn btn-dark" href={`/${locale}/login`}>
            {t("backToLogin")}
          </Link>
        </div>
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
      <div className="auth-card invite-card">
        {invitation ? (
          <div className="invite-summary">
            <div className="quality-pill">{company?.company_name ?? t("companyWorkspaceFallback")}</div>
            <h2 style={{ marginTop: 18 }}>{company?.company_name ?? t("companyInviteFallback")}</h2>
            <p className="section-copy">
              {t.rich("inviteSummary", {
                email: invitedEmail,
                role: localizedRole,
                teamSuffix: team?.name ? t("inviteSummaryTeamSuffix", { teamName: team.name }) : t("inviteSummaryNoTeamSuffix"),
                strong: (chunks) => <strong>{chunks}</strong>
              })}
            </p>
          </div>
        ) : (
          <div className="invite-feedback error">
            <ShieldAlert size={18} />
            <span>{t("tokenNotFound")}</span>
          </div>
        )}

        {isAccepted ? (
          <div className="invite-success-stack">
            <div className="invite-feedback success">
              <CheckCircle2 size={18} />
              <span>{t("profileAttached")}</span>
            </div>
            <Link className="btn btn-dark" href={next || `/${locale}/employee`}>
              {t("openWorkspace")} <ArrowRight size={16} />
            </Link>
          </div>
        ) : isError ? (
          <div className="invite-success-stack">
            <div className="invite-feedback error">
              <ShieldAlert size={18} />
              <span>{getReasonCopy(reason)}</span>
            </div>
            <div className="auth-links" style={{ marginTop: 0 }}>
              <Link href={`/${locale}/login?invite=${token}`}>{t("tryLoginAgain")}</Link>
              <Link href={`/${locale}/signup?invite=${token}`}>{t("createAccount")}</Link>
            </div>
          </div>
        ) : invitation ? (
          <div className="invite-success-stack">
            <div className="invite-link-card">
              <div className="invite-link-meta">
                <strong>{t("invitationDetails")}</strong>
                <small>{t("expiresOn", { date: expiryLabel })}</small>
              </div>
              <div className="invite-status-points">
                <span>
                  <Mail size={14} />
                  {t("invitedEmail", { email: invitedEmail })}
                </span>
                <span>{t("roleLine", { role: localizedRole })}</span>
                <span>{t("teamLine", { team: team?.name ?? t("teamAssignLater") })}</span>
              </div>
            </div>

            {user ? (
              loggedInWithMatchingEmail ? (
                <Link className="btn btn-dark" href={`/auth/callback?invite=${token}`}>
                  {t("acceptInvitation")} <ArrowRight size={16} />
                </Link>
              ) : (
                <div className="invite-feedback error">
                  <ShieldAlert size={18} />
                  <span>{t("loggedInMismatch", { sessionEmail: user.email ?? "", invitedEmail })}</span>
                </div>
              )
            ) : (
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <Link className="btn btn-dark" href={`/${locale}/signup?invite=${token}`}>
                  {t("createAccount")} <ArrowRight size={16} />
                </Link>
                <Link className="btn btn-secondary" href={`/${locale}/login?invite=${token}`}>
                  {t("logIn")}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="invite-success-stack">
            <div className="invite-feedback error">
              <ShieldAlert size={18} />
              <span>{t("noLongerAvailable")}</span>
            </div>
            <Link className="btn btn-secondary" href={`/${locale}/login`}>
              {t("backToLogin")}
            </Link>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
