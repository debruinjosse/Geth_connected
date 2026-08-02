import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Building2, Shield, Star, UserRound, UsersRound } from "lucide-react";
import { createCompanyInviteFromAdminAction, updateCompanyStatusAction } from "@/app/actions/adminControls";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminProfile = {
  first_name: string | null;
  last_name: string | null;
  role: string;
};

type Company = {
  id: string;
  company_name: string;
  slug: string | null;
  industry: string | null;
  subscription_plan: string | null;
  subscription_status: string | null;
  status: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string;
  status: string | null;
  team_id: string | null;
};

type TeamRow = {
  id: string;
  name: string;
  manager_id: string | null;
};

type InvitationRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  expires_at: string;
};

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "SA";
}

function formatDate(value: string, dateLocale: string) {
  return new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium" }).format(new Date(value));
}

function getName(profile: ProfileRow, fallbackLabel: string) {
  return `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || profile.email || fallbackLabel;
}

export default async function AdminCompanyDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ invite?: string }>;
}) {
  const [{ companyId }, { invite }, locale] = await Promise.all([params, searchParams, getLocale()]);
  const t = await getTranslations({ locale, namespace: "adminPages" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const dateLocale = locale === "nl" ? "nl-NL" : "en";
  const returnTo = `/${locale}/admin/companies/${companyId}`;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect(`/${locale}/admin/companies`);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/login`);
  }

  const { data: adminProfile, error: adminError } = await supabase
    .from("profiles")
    .select("first_name, last_name, role")
    .eq("id", user.id)
    .maybeSingle<AdminProfile>();

  if (adminError || !adminProfile || !["platform_admin", "super_admin"].includes(adminProfile.role)) {
    redirect("/auth/repair-profile?next=/admin");
  }

  const [
    { data: company, error: companyError },
    { data: profiles, error: profilesError },
    { data: teams, error: teamsError },
    { data: invitations, error: invitationsError },
    { count: recognitionCount },
    unreadNotifications
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("id, company_name, slug, industry, subscription_plan, subscription_status, status, created_at")
      .eq("id", companyId)
      .maybeSingle<Company>(),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email, role, status, team_id")
      .eq("company_id", companyId)
      .order("role")
      .order("first_name"),
    supabase.from("teams").select("id, name, manager_id").eq("company_id", companyId).order("name"),
    supabase.from("invitations").select("id, email, role, status, token, expires_at").eq("company_id", companyId).order("created_at", { ascending: false }).limit(8),
    supabase.from("recognition_events").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  if (companyError) {
    notFound();
  }

  if (!company) {
    notFound();
  }

  if (profilesError || teamsError || invitationsError) {
    throw new Error(t("errLoadCompanyDetail"));
  }

  const companyProfiles = (profiles ?? []) as ProfileRow[];
  const companyTeams = (teams ?? []) as TeamRow[];
  const pendingInvitations = ((invitations ?? []) as InvitationRow[]).filter((inviteRow) => inviteRow.status === "pending");
  const companyAdmins = companyProfiles.filter((profile) => profile.role === "company_admin");
  const managers = companyProfiles.filter((profile) => profile.role === "manager");
  const employees = companyProfiles.filter((profile) => profile.role === "employee");
  const teamMap = new Map(companyTeams.map((team) => [team.id, team.name]));
  const managerMap = new Map(companyProfiles.map((profile) => [profile.id, getName(profile, tc("gethUser"))]));

  return (
    <DashboardShell
      role="admin"
      title={company.company_name}
      subtitle={t("companyDetailSubtitle")}
      user={{
        name: `${adminProfile.first_name ?? ""} ${adminProfile.last_name ?? ""}`.trim() || tc("platformAdminName"),
        initials: getInitials(adminProfile.first_name, adminProfile.last_name),
        team: tc("platformTeam")
      }}
      actions={<Link className="btn btn-secondary" href={`/${locale}/admin/companies`}>{t("backToCompanies")}</Link>}
      unreadNotifications={unreadNotifications}
    >
      <section className="metrics-grid">
        <MetricCard icon={<Shield />} value={companyAdmins.length} label={t("metricCompanyAdmins")} helper={t("metricCompanyAdminsHelper")} />
        <MetricCard icon={<UsersRound />} value={managers.length} label={t("metricManagers")} helper={t("metricManagersHelper")} tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
        <MetricCard icon={<UserRound />} value={employees.length} label={t("metricEmployees")} helper={t("metricEmployeesHelper")} />
        <MetricCard icon={<Star />} value={recognitionCount ?? 0} label={t("metricRecognitionsCompany")} helper={t("metricRecognitionsCompanyHelper")} tone="var(--theme-emerald)" iconBackground="rgba(58, 166, 95, 0.12)" />
      </section>

      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <div>
              <h2>{t("workspaceStatusTitle")}</h2>
              <p className="section-copy">{t("workspaceStatusCopy")}</p>
            </div>
          </div>
          <div className="profile-stack">
            <div><strong>{t("industryLabel")}</strong><p>{company.industry ?? tc("notSet")}</p></div>
            <div><strong>{t("slugLabel")}</strong><p>{company.slug ?? tc("notSet")}</p></div>
            <div><strong>{tc("plan")}</strong><p>{company.subscription_plan ?? "Starter"}</p></div>
            <div><strong>{t("billingStatusLabel")}</strong><p>{company.subscription_status ?? "not_configured"}</p></div>
            <div><strong>{t("createdLabel")}</strong><p>{formatDate(company.created_at, dateLocale)}</p></div>
          </div>
          <form action={updateCompanyStatusAction} className="admin-control-form" style={{ marginTop: 18 }}>
            <input type="hidden" name="companyId" value={company.id} />
            <label className="sr-only" htmlFor="company-status">{t("companyStatusLabel")}</label>
            <select id="company-status" name="status" defaultValue={company.status ?? "active"} aria-label={`Update ${company.company_name} status`}>
              <option value="active">{t("statusActiveOption")}</option>
              <option value="demo">{t("statusDemoOption")}</option>
              <option value="inactive">{t("statusInactiveOption")}</option>
            </select>
            <button className="btn btn-secondary compact" type="submit">{t("saveStatusButton")}</button>
          </form>
        </article>

        <article className="panel dashboard-panel">
          <div className="panel-top">
            <div>
              <h2>{t("hierarchyTitle")}</h2>
              <p className="section-copy">{t("hierarchyCopy")}</p>
            </div>
          </div>
          <div className="signal-list">
            <div className="signal-card">
              <Building2 size={18} />
              <div><strong>{t("platformHierarchyTitle")}</strong><p>{t("platformHierarchyCopy")}</p></div>
            </div>
            <div className="signal-card">
              <Shield size={18} />
              <div><strong>{company.company_name}</strong><p>{t("companyAdminsManage", { count: companyAdmins.length })}</p></div>
            </div>
            <div className="signal-card">
              <UsersRound size={18} />
              <div><p>{t("teamsManagersEmployees", { teams: companyTeams.length, managers: managers.length, employees: employees.length })}</p></div>
            </div>
          </div>
          <form action={createCompanyInviteFromAdminAction} className="admin-invite-form">
            <input type="hidden" name="companyId" value={company.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <input type="hidden" name="locale" value={locale} />
            <div>
              <h3>{t("sendInviteTitle")}</h3>
              <p className="section-copy">{t("sendInviteCopy")}</p>
            </div>
            {invite ? (
              <p className={`settings-feedback ${invite === "created" ? "success" : "error"}`}>
                {invite === "created" ? t("inviteCreatedSuccess") : t("inviteCreatedPartial")}
              </p>
            ) : null}
            <label>
              {t("workEmailLabel")}
              <input className="input" type="email" name="email" placeholder="new.user@company.com" required />
            </label>
            <label>
              {t("roleLabel")}
              <select className="input" name="role" defaultValue="employee">
                <option value="employee">{t("roleEmployeeOption")}</option>
                <option value="manager">{t("roleManagerOption")}</option>
                <option value="company_admin">{t("roleCompanyAdminOption")}</option>
              </select>
            </label>
            <button className="btn btn-primary compact" type="submit">{t("sendInviteButton")}</button>
          </form>
        </article>
      </section>

      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <div>
              <h2>{t("teamsSectionTitle")}</h2>
              <p className="section-copy">{t("teamsSectionCopy")}</p>
            </div>
          </div>
          {companyTeams.length ? (
            <div className="table-wrap">
              <table className="dashboard-table">
                <thead><tr><th>{t("tableTeam")}</th><th>{t("tableManager")}</th></tr></thead>
                <tbody>
                  {companyTeams.map((team) => (
                    <tr key={team.id}>
                      <td><strong>{team.name}</strong></td>
                      <td>{team.manager_id ? managerMap.get(team.manager_id) ?? t("assignedManager") : tc("unassigned")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title={t("emptyNoTeamsTitle")} copy={t("emptyNoTeamsCopy")} />
          )}
        </article>

        <article className="panel dashboard-panel">
          <div className="panel-top">
            <div>
              <h2>{t("pendingInvitationsTitle")}</h2>
              <p className="section-copy">{t("pendingInvitationsCopy")}</p>
            </div>
          </div>
          {pendingInvitations.length ? (
            <div className="signal-list">
              {pendingInvitations.map((inviteRow) => (
                <div className="signal-card" key={inviteRow.id}>
                  <div>
                    <strong>{inviteRow.email}</strong>
                    <p>{t("inviteExpires", { role: inviteRow.role.replace("_", " "), date: formatDate(inviteRow.expires_at, dateLocale) })}</p>
                    <Link className="panel-link" href={`/${locale}/invite/${inviteRow.token}`}>{t("openRegistrationLink")}</Link>
                  </div>
                  <span className="quality-pill">{inviteRow.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t("emptyNoInvitesTitle")} copy={t("emptyNoInvitesCopy")} />
          )}
        </article>
      </section>

      <article className="panel dashboard-panel">
        <div className="panel-top">
          <div>
            <h2>{t("peopleTitle")}</h2>
            <p className="section-copy">{t("peopleCopy")}</p>
          </div>
        </div>
        {companyProfiles.length ? (
          <div className="table-wrap">
            <table className="dashboard-table">
              <thead><tr><th>{t("tableName")}</th><th>{t("tableEmail")}</th><th>{t("tableRole")}</th><th>{t("tableTeam")}</th><th>{t("tableStatus")}</th></tr></thead>
              <tbody>
                {companyProfiles.map((profile) => (
                  <tr key={profile.id}>
                    <td><strong>{getName(profile, tc("gethUser"))}</strong></td>
                    <td>{profile.email ?? tc("noEmail")}</td>
                    <td>{profile.role.replace("_", " ")}</td>
                    <td>{profile.team_id ? teamMap.get(profile.team_id) ?? t("assignedTeam") : tc("unassigned")}</td>
                    <td><span className="admin-status-pill">{profile.status ?? "active"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={t("emptyNoProfilesTitle")} copy={t("emptyNoProfilesCopy")} />
        )}
      </article>
    </DashboardShell>
  );
}
