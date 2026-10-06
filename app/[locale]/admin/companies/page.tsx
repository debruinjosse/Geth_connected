import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createCompanyWorkspaceAction, updateCompanyStatusAction } from "@/app/actions/adminControls";
import { AdminCompanyDeleteButton } from "@/components/AdminCompanyDeleteButton";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { superAdminUser } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Panel } from "@/components/ui/Panel";
import { Table } from "@/components/ui/Table";
import { Pill } from "@/components/ui/Pill";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, FieldGrid, Input, Select } from "@/components/ui/Fields";

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
      actions={<Pill>{tc("liveData")}</Pill>}
    >
      {deleteStatus === "success" ? (
        <Alert tone="success">{t("deleteCompanySuccess")}</Alert>
      ) : null}
      {deleteStatus === "failed" ? (
        <Alert tone="error">{t("deleteCompanyFailed")}</Alert>
      ) : null}

      <Panel title={t("createCompanyWorkspaceTitle")} description={t("createCompanyWorkspaceCopy")}>
        <form action={createCompanyWorkspaceAction}>
          <input type="hidden" name="locale" value={locale} />
          <FieldGrid>
            <Field label={t("formCompanyNameLabel")} htmlFor="companyName" required>
              <Input id="companyName" name="companyName" placeholder="ABC Company" required />
            </Field>
            <Field label={t("formCompanySlugLabel")} htmlFor="slug">
              <Input id="slug" name="slug" placeholder="abc-company" />
            </Field>
            <Field label={t("formIndustryLabel")} htmlFor="industry">
              <Input id="industry" name="industry" placeholder="Technology, healthcare, education..." />
            </Field>
            <Field label={t("formPlanLabel")} htmlFor="subscriptionPlan">
              <Select id="subscriptionPlan" name="subscriptionPlan" defaultValue="growth">
                <option value="growth">Growth — €11.99 / employee / month</option>
                <option value="enterprise">Custom — 50+ employees</option>
              </Select>
            </Field>
            <Field label={t("formContactNameLabel")} htmlFor="contactName">
              <Input id="contactName" name="contactName" placeholder="Tim Schobbe" />
            </Field>
            <Field label={t("formContactPhoneLabel")} htmlFor="contactPhone">
              <Input id="contactPhone" name="contactPhone" type="tel" placeholder="+31 6 12345678" />
            </Field>
            <Field label={t("formCompanyAdminEmailLabel")} htmlFor="companyAdminEmail" required>
              <Input id="companyAdminEmail" name="companyAdminEmail" type="email" placeholder="admin@company.com" required />
            </Field>
            <Field label={t("formStarterTeamLabel")} htmlFor="teamName">
              <Input id="teamName" name="teamName" placeholder="Marketing Team" />
            </Field>
            <Field label={t("formStarterManagerEmailLabel")} htmlFor="managerEmail">
              <Input id="managerEmail" name="managerEmail" type="email" placeholder="manager@company.com" />
            </Field>
          </FieldGrid>
          <div className="lp-form-foot">
            <small className="lp-hint">{t("inviteLinksHelp")}</small>
            <Button type="submit">{t("createCompanyAndInvites")}</Button>
          </div>
        </form>
      </Panel>

      <Panel>
        <>
          {companyRows.length ? (
            <Table className="lp-table-flat lp-table-stack">
              <thead>
                <tr>
                  <th>{t("tableCompany")}</th>
                  <th>{t("tableInviteEmail")}</th>
                  <th className="lp-ncol">{t("tableUsers")}</th>
                  <th className="lp-ncol">{t("tableManagers")}</th>
                  <th className="lp-ncol">{t("tableTeams")}</th>
                  <th className="lp-act">{t("tableControl")}</th>
                </tr>
              </thead>
              <tbody>
                {companyRows.map((company) => {
                  const inviteEmail =
                    company.contact_email ?? adminInviteEmails.get(company.id) ?? adminProfileEmails.get(company.id) ?? t("contactNotSet");

                  return (
                    <tr key={company.id}>
                      <td>
                        <Link className="lp-link-strong" href={`/${locale}/admin/companies/${company.id}`}>{company.company_name}</Link>
                        <small className="lp-cell-sub">{company.industry ?? t("noIndustrySet")} · {company.subscription_plan}</small>
                      </td>
                      <td data-label={t("tableInviteEmail")}>
                        {company.contact_name ?? inviteEmail}
                        <small className="lp-cell-sub">{company.contact_name ? inviteEmail : t("contactNotSet")}{company.contact_phone ? ` · ${company.contact_phone}` : ""}</small>
                      </td>
                      <td className="lp-ncol" data-label={t("tableUsers")}>{profileCounts.get(company.id) ?? 0}</td>
                      <td className="lp-ncol" data-label={t("tableManagers")}>{managerCounts.get(company.id) ?? 0}</td>
                      <td className="lp-ncol" data-label={t("tableTeams")}>{teamCounts.get(company.id) ?? 0}</td>
                      <td className="lp-act" data-label={t("tableControl")} data-wide>
                        <div className="lp-row-actions">
                          <form action={updateCompanyStatusAction} className="lp-inline-ctl">
                            <input type="hidden" name="companyId" value={company.id} />
                            <Select className="lp-select-sm" id={`status-${company.id}`} name="status" defaultValue={company.status ?? "active"} aria-label={`${t("companyStatusLabel")} — ${company.company_name}`}>
                              <option value="active">{t("statusActiveOption")}</option>
                              <option value="demo">{t("statusDemoOption")}</option>
                              <option value="inactive">{t("statusInactiveOption")}</option>
                            </Select>
                            <Button variant="ghost" size="sm" type="submit">{t("saveButton")}</Button>
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
            </Table>
          ) : (
            <EmptyState title={t("emptyNoCompaniesListTitle")} copy={t("emptyNoCompaniesListCopy")} />
          )}
        </>
      </Panel>
    </DashboardShell>
  );
}
