import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createCompanyWorkspaceAction, updateCompanyStatusAction } from "@/app/actions/adminControls";
import { AdminCompanyDeleteButton } from "@/components/AdminCompanyDeleteButton";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { superAdminUser } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "GA";
}

type CompanyRow = {
  id: string;
  company_name: string;
  subscription_plan: string | null;
  status: string | null;
  industry: string | null;
  created_at: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
};

export default async function AdminCompaniesPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ delete?: string }>;
}) {
  const [{ locale }, { delete: deleteStatus }] = await Promise.all([params, searchParams]);
  const t = await getTranslations({ locale, namespace: "adminPages" });
  const tc = await getTranslations({ locale, namespace: "common" });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <DashboardShell role="admin" title={t("companiesTitle")} subtitle={t("companiesNoSupabaseSubtitle")} user={superAdminUser}>
        <EmptyState title={t("companiesNoSupabaseTitle")} copy={t("companiesNoSupabaseCopy")} />
      </DashboardShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) redirect(`/${locale}/login`);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name, role")
    .eq("id", user.id)
    .maybeSingle<{ first_name: string; last_name: string; role: string }>();

  if (profileError || !profile || !["platform_admin", "super_admin"].includes(profile.role)) {
    redirect("/auth/repair-profile");
  }

  const [
    { data: companies, error: companiesError },
    { data: profiles, error: profilesError },
    { data: teams, error: teamsError },
    { data: invitations, error: invitationsError }
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("id, company_name, subscription_plan, status, industry, created_at, contact_name, contact_phone, contact_email")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, company_id, role, email"),
    supabase.from("teams").select("id, company_id"),
    supabase.from("invitations").select("company_id, email, role, created_at").eq("role", "company_admin").order("created_at", { ascending: false })
  ]);

  if (companiesError || profilesError || teamsError || invitationsError) {
    throw new Error(t("errLoadCompanies"));
  }

  const profileCounts = new Map<string, number>();
  const managerCounts = new Map<string, number>();
  const teamCounts = new Map<string, number>();
  const adminProfileEmails = new Map<string, string>();
  const adminInviteEmails = new Map<string, string>();

  for (const item of profiles ?? []) {
    if (!item.company_id) continue;
    profileCounts.set(item.company_id, (profileCounts.get(item.company_id) ?? 0) + 1);
    if (item.role === "manager") {
      managerCounts.set(item.company_id, (managerCounts.get(item.company_id) ?? 0) + 1);
    }
    if (item.role === "company_admin" && item.email && !adminProfileEmails.has(item.company_id)) {
      adminProfileEmails.set(item.company_id, item.email);
    }
  }

  for (const team of teams ?? []) {
    teamCounts.set(team.company_id, (teamCounts.get(team.company_id) ?? 0) + 1);
  }

  for (const invitation of invitations ?? []) {
    if (!invitation.company_id || !invitation.email || adminInviteEmails.has(invitation.company_id)) {
      continue;
    }
    adminInviteEmails.set(invitation.company_id, invitation.email);
  }

  const companyRows = (companies ?? []) as CompanyRow[];

  return (
    <DashboardShell
      role="admin"
      title={t("companiesTitle")}
      subtitle={t("companiesSubtitle")}
      user={{
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        initials: getInitials(profile.first_name, profile.last_name),
        team: tc("platformTeam")
      }}
      actions={<span className="quality-pill">{tc("liveData")}</span>}
    >
      {deleteStatus === "success" ? (
        <p className="settings-feedback success">{t("deleteCompanySuccess")}</p>
      ) : null}
      {deleteStatus === "failed" ? (
        <p className="settings-feedback error">{t("deleteCompanyFailed")}</p>
      ) : null}

      <article className="panel dashboard-panel">
        <div className="panel-top">
          <div>
            <h2>{t("createCompanyWorkspaceTitle")}</h2>
            <p className="section-copy">{t("createCompanyWorkspaceCopy")}</p>
          </div>
        </div>
        <form action={createCompanyWorkspaceAction} className="form-grid admin-company-create-form">
          <input type="hidden" name="locale" value={locale} />
          <div className="form-field">
            <label htmlFor="companyName">{t("formCompanyNameLabel")}</label>
            <input id="companyName" className="input" name="companyName" placeholder="ABC Company" required />
          </div>
          <div className="form-field">
            <label htmlFor="slug">{t("formCompanySlugLabel")}</label>
            <input id="slug" className="input" name="slug" placeholder="abc-company" />
          </div>
          <div className="form-field">
            <label htmlFor="industry">{t("formIndustryLabel")}</label>
            <input id="industry" className="input" name="industry" placeholder="Technology, healthcare, education..." />
          </div>
          <div className="form-field">
            <label htmlFor="subscriptionPlan">{t("formPlanLabel")}</label>
            <select id="subscriptionPlan" className="input" name="subscriptionPlan" defaultValue="growth">
              <option value="growth">Growth — €11.99 / employee / month</option>
              <option value="enterprise">Custom — 50+ employees</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="contactName">{t("formContactNameLabel")}</label>
            <input id="contactName" className="input" name="contactName" placeholder="Tim Schobbe" />
          </div>
          <div className="form-field">
            <label htmlFor="contactPhone">{t("formContactPhoneLabel")}</label>
            <input id="contactPhone" className="input" name="contactPhone" type="tel" placeholder="+31 6 12345678" />
          </div>
          <div className="form-field">
            <label htmlFor="companyAdminEmail">{t("formCompanyAdminEmailLabel")}</label>
            <input id="companyAdminEmail" className="input" name="companyAdminEmail" type="email" placeholder="admin@company.com" required />
          </div>
          <div className="form-field">
            <label htmlFor="teamName">{t("formStarterTeamLabel")}</label>
            <input id="teamName" className="input" name="teamName" placeholder="Marketing Team" />
          </div>
          <div className="form-field">
            <label htmlFor="managerEmail">{t("formStarterManagerEmailLabel")}</label>
            <input id="managerEmail" className="input" name="managerEmail" type="email" placeholder="manager@company.com" />
          </div>
          <div className="form-field admin-company-create-submit">
            <span className="field-help">{t("inviteLinksHelp")}</span>
            <button className="btn btn-dark" type="submit">{t("createCompanyAndInvites")}</button>
          </div>
        </form>
      </article>

      <article className="panel dashboard-panel">
        <div className="table-wrap">
          {companyRows.length ? (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>{t("tableCompany")}</th>
                  <th>{t("tableInviteEmail")}</th>
                  <th>{t("tableContactName")}</th>
                  <th>{t("tableContactPhone")}</th>
                  <th>{t("tablePlan")}</th>
                  <th>{t("tableStatus")}</th>
                  <th>{t("tableUsers")}</th>
                  <th>{t("tableManagers")}</th>
                  <th>{t("tableTeams")}</th>
                  <th>{t("tableControl")}</th>
                </tr>
              </thead>
              <tbody>
                {companyRows.map((company) => {
                  const inviteEmail =
                    company.contact_email ?? adminInviteEmails.get(company.id) ?? adminProfileEmails.get(company.id) ?? t("contactNotSet");

                  return (
                    <tr key={company.id}>
                      <td>
                        <strong>{company.company_name}</strong>
                        <p style={{ margin: "4px 0 0", color: "var(--theme-muted)" }}>{company.industry ?? t("noIndustrySet")}</p>
                        <Link className="panel-link" href={`/${locale}/admin/companies/${company.id}`}>{t("openHierarchy")}</Link>
                      </td>
                      <td>{inviteEmail}</td>
                      <td>{company.contact_name ?? t("contactNotSet")}</td>
                      <td>{company.contact_phone ?? t("contactNotSet")}</td>
                      <td>{company.subscription_plan}</td>
                      <td><span className="admin-status-pill">{company.status}</span></td>
                      <td>{profileCounts.get(company.id) ?? 0}</td>
                      <td>{managerCounts.get(company.id) ?? 0}</td>
                      <td>{teamCounts.get(company.id) ?? 0}</td>
                      <td>
                        <div className="admin-control-form">
                          <form action={updateCompanyStatusAction}>
                            <input type="hidden" name="companyId" value={company.id} />
                            <label className="sr-only" htmlFor={`status-${company.id}`}>{t("companyStatusLabel")}</label>
                            <select id={`status-${company.id}`} name="status" defaultValue={company.status ?? "active"} aria-label={`Update ${company.company_name} status`}>
                              <option value="active">{t("statusActiveOption")}</option>
                              <option value="demo">{t("statusDemoOption")}</option>
                              <option value="inactive">{t("statusInactiveOption")}</option>
                            </select>
                            <button className="btn btn-secondary compact" type="submit">{t("saveButton")}</button>
                          </form>
                          <AdminCompanyDeleteButton
                            companyId={company.id}
                            locale={locale}
                            confirmMessage={t("deleteCompanyConfirm", { companyName: company.company_name })}
                            deleteLabel={t("deleteCompanyButton")}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <EmptyState title={t("emptyNoCompaniesListTitle")} copy={t("emptyNoCompaniesListCopy")} />
          )}
        </div>
      </article>
    </DashboardShell>
  );
}
