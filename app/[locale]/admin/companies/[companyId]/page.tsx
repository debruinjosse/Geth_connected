import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Building2, Shield, Star, UserRound, UsersRound } from "lucide-react";
import {
  createCompanyInviteFromAdminAction,
  updateCompanyCardCategoriesAction,
  updateCompanyContactAction,
  updateCompanyInsightFeaturesAction,
  updateCompanyStatusAction
} from "@/app/actions/adminControls";
import { AdminTeamDeleteButton } from "@/components/AdminTeamDeleteButton";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { getCompanyCardCategories } from "@/lib/company-card-categories";
import { getCompanyInsightFeatures } from "@/lib/company-insight-features";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Grid } from "@/components/ui/Grid";
import { Panel } from "@/components/ui/Panel";
import { Table } from "@/components/ui/Table";
import { Pill } from "@/components/ui/Pill";
import { StatusPill } from "@/components/ui/StatusPill";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field, Input, Select } from "@/components/ui/Fields";
import { Feed, FeedItem } from "@/components/ui/Feed";

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
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
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
  searchParams: Promise<{ invite?: string; contact?: string; team?: string; created?: string }>;
}) {
  const [{ companyId }, { invite, contact, team, created }, locale] = await Promise.all([params, searchParams, getLocale()]);
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
      .select("id, company_name, slug, industry, subscription_plan, subscription_status, status, created_at, contact_name, contact_phone, contact_email")
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

  const insightFeatures = await getCompanyInsightFeatures(supabase, companyId);
  const cardCategories = await getCompanyCardCategories(supabase, companyId);

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
      actions={<Button variant="ghost" size="sm" href={`/${locale}/admin/companies`}>{t("backToCompanies")}</Button>}
      unreadNotifications={unreadNotifications}
    >
      {created ? (
        <Alert tone="success">{t("companyCreatedSuccess")}</Alert>
      ) : null}
      {contact === "updated" ? (
        <Alert tone="success">{t("contactUpdatedSuccess")}</Alert>
      ) : null}
      {contact === "failed" ? (
        <Alert tone="error">{t("contactUpdateFailed")}</Alert>
      ) : null}
      {team === "deleted" ? (
        <Alert tone="success">{t("teamDeletedSuccess")}</Alert>
      ) : null}
      {team === "failed" ? (
        <Alert tone="error">{t("teamDeleteFailed")}</Alert>
      ) : null}

      <Grid cols="three">
        <MetricCard icon={<Shield />} value={companyAdmins.length} label={t("metricCompanyAdmins")} helper={t("metricCompanyAdminsHelper")} />
        <MetricCard icon={<UsersRound />} value={managers.length} label={t("metricManagers")} helper={t("metricManagersHelper")} tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
        <MetricCard icon={<UserRound />} value={employees.length} label={t("metricEmployees")} helper={t("metricEmployeesHelper")} />
        <MetricCard icon={<Star />} value={recognitionCount ?? 0} label={t("metricRecognitionsCompany")} helper={t("metricRecognitionsCompanyHelper")} tone="var(--theme-emerald)" iconBackground="rgba(58, 166, 95, 0.12)" />
      </Grid>

      <Grid cols="two">
        <Panel title={t("workspaceStatusTitle")} description={t("workspaceStatusCopy")}>
          <dl className="lp-kv">
            <div><dt>{t("industryLabel")}</dt><dd>{company.industry ?? tc("notSet")}</dd></div>
            <div><dt>{t("slugLabel")}</dt><dd>{company.slug ?? tc("notSet")}</dd></div>
            <div><dt>{tc("plan")}</dt><dd>{company.subscription_plan ?? "Starter"}</dd></div>
            <div><dt>{t("billingStatusLabel")}</dt><dd>{company.subscription_status ?? "not_configured"}</dd></div>
            <div><dt>{t("createdLabel")}</dt><dd>{formatDate(company.created_at, dateLocale)}</dd></div>
          </dl>
          <form action={updateCompanyStatusAction} className="lp-inline-ctl lp-mt">
            <input type="hidden" name="companyId" value={company.id} />
            <Select className="lp-select-sm" id="company-status" name="status" defaultValue={company.status ?? "active"} aria-label={t("companyStatusLabel")}>
              <option value="active">{t("statusActiveOption")}</option>
              <option value="demo">{t("statusDemoOption")}</option>
              <option value="inactive">{t("statusInactiveOption")}</option>
            </Select>
            <Button variant="ghost" size="sm" type="submit">{t("saveStatusButton")}</Button>
          </form>
        </Panel>

        <Panel title={t("insightFeaturesTitle")} description={t("insightFeaturesCopy")}>
          <form action={updateCompanyInsightFeaturesAction} className="lp-check-form">
            <input type="hidden" name="companyId" value={company.id} />
            <Checkbox name="growthTimeline" defaultChecked={insightFeatures.growthTimeline} label={t("insightFeatureGrowthTimeline")} />
            <Checkbox name="hiddenPatterns" defaultChecked={insightFeatures.hiddenPatterns} label={t("insightFeatureHiddenPatterns")} />
            <Checkbox name="milestones" defaultChecked={insightFeatures.milestones} label={t("insightFeatureMilestones")} />
            <Checkbox name="masterInsight" defaultChecked={insightFeatures.masterInsight} label={t("insightFeatureMasterInsight")} />
            <Button variant="ghost" size="sm" type="submit">{t("saveInsightFeaturesButton")}</Button>
          </form>
        </Panel>

        <Panel title={t("cardCategoriesTitle")} description={t("cardCategoriesCopy")}>
          <form action={updateCompanyCardCategoriesAction} className="lp-check-form">
            <input type="hidden" name="companyId" value={company.id} />
            <Checkbox name="communication" defaultChecked={cardCategories.communication} label={t("cardCategoryCommunication")} />
            <Checkbox name="creativity" defaultChecked={cardCategories.creativity} label={t("cardCategoryCreativity")} />
            <Checkbox name="competence" defaultChecked={cardCategories.competence} label={t("cardCategoryCompetence")} />
            <Checkbox name="collegiality" defaultChecked={cardCategories.collegiality} label={t("cardCategoryCollegiality")} />
            <Checkbox name="open" defaultChecked={cardCategories.open} label={t("cardCategoryOpen")} />
            <Button variant="ghost" size="sm" type="submit">{t("saveCardCategoriesButton")}</Button>
          </form>
        </Panel>

        <Panel title={t("hierarchyTitle")} description={t("hierarchyCopy")}>
          <Feed>
            <FeedItem title={t("platformHierarchyTitle")} note={t("platformHierarchyCopy")} />
            <FeedItem title={company.company_name} note={t("companyAdminsManage", { count: companyAdmins.length })} />
            <FeedItem title={t("teamsManagersEmployees", { teams: companyTeams.length, managers: managers.length, employees: employees.length })} />
          </Feed>
          <form action={createCompanyInviteFromAdminAction} className="lp-subform">
            <input type="hidden" name="companyId" value={company.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <input type="hidden" name="locale" value={locale} />
            <div>
              <h3>{t("sendInviteTitle")}</h3>
              <p className="lp-hint">{t("sendInviteCopy")}</p>
            </div>
            {invite ? (
              <Alert tone={invite === "created" ? "success" : "error"}>
                {invite === "created" ? t("inviteCreatedSuccess") : t("inviteCreatedPartial")}
              </Alert>
            ) : null}
            <Field label={t("workEmailLabel")} htmlFor="inviteEmail" required>
              <Input id="inviteEmail" type="email" name="email" placeholder="new.user@company.com" required />
            </Field>
            <Field label={t("roleLabel")} htmlFor="inviteRole">
              <Select id="inviteRole" name="role" defaultValue="employee">
                <option value="employee">{t("roleEmployeeOption")}</option>
                <option value="manager">{t("roleManagerOption")}</option>
                <option value="company_admin">{t("roleCompanyAdminOption")}</option>
              </Select>
            </Field>
            <div><Button type="submit" size="sm">{t("sendInviteButton")}</Button></div>
          </form>
        </Panel>

        <Panel title={t("companyContactTitle")} description={t("companyContactCopy")}>
          <form action={updateCompanyContactAction} className="lp-subform">
            <input type="hidden" name="companyId" value={company.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <input type="hidden" name="locale" value={locale} />
            <Field label={t("formContactNameLabel")} htmlFor="contactName">
              <Input id="contactName" name="contactName" defaultValue={company.contact_name ?? ""} placeholder="Tim Schobbe" />
            </Field>
            <Field label={t("formContactPhoneLabel")} htmlFor="contactPhone">
              <Input id="contactPhone" name="contactPhone" type="tel" defaultValue={company.contact_phone ?? ""} placeholder="+31 6 12345678" />
            </Field>
            <Field label={t("formContactEmailLabel")} htmlFor="contactEmail">
              <Input id="contactEmail" name="contactEmail" type="email" defaultValue={company.contact_email ?? ""} placeholder="admin@company.com" />
            </Field>
            <div><Button variant="ghost" size="sm" type="submit">{t("saveContactButton")}</Button></div>
          </form>
        </Panel>
      </Grid>

      <Grid cols="two">
        <Panel title={t("teamsSectionTitle")} description={t("teamsSectionCopy")}>
          {companyTeams.length ? (
            <>
              <Table className="lp-table-flat lp-table-stack">
                <thead><tr><th>{t("tableTeam")}</th><th>{t("tableManager")}</th><th className="lp-act">{t("tableActions")}</th></tr></thead>
                <tbody>
                  {companyTeams.map((team) => (
                    <tr key={team.id}>
                      <td><strong>{team.name}</strong></td>
                      <td data-label={t("tableManager")}>{team.manager_id ? managerMap.get(team.manager_id) ?? t("assignedManager") : tc("unassigned")}</td>
                      <td className="lp-act" data-label={t("tableActions")}>
                        <AdminTeamDeleteButton
                          teamId={team.id}
                          companyId={company.id}
                          locale={locale}
                          returnTo={returnTo}
                          confirmMessage={t("deleteTeamConfirm", { teamName: team.name })}
                          deleteLabel={t("deleteTeamButton")}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          ) : (
            <EmptyState title={t("emptyNoTeamsTitle")} copy={t("emptyNoTeamsCopy")} />
          )}
        </Panel>

        <Panel title={t("pendingInvitationsTitle")} description={t("pendingInvitationsCopy")}>
          {pendingInvitations.length ? (
            <Feed>
              {pendingInvitations.map((inviteRow) => (
                <FeedItem
                  key={inviteRow.id}
                  title={inviteRow.email}
                  note={t("inviteExpires", { role: inviteRow.role.replace("_", " "), date: formatDate(inviteRow.expires_at, dateLocale) })}
                  tag={<StatusPill raw={inviteRow.status}>{inviteRow.status}</StatusPill>}
                >
                  <Link className="lp-link" href={`/${locale}/invite/${inviteRow.token}`}>{t("openRegistrationLink")}</Link>
                </FeedItem>
              ))}
            </Feed>
          ) : (
            <EmptyState title={t("emptyNoInvitesTitle")} copy={t("emptyNoInvitesCopy")} />
          )}
        </Panel>
      </Grid>

      <Panel title={t("peopleTitle")} description={t("peopleCopy")}>
        {companyProfiles.length ? (
          <>
            <Table className="lp-table-flat lp-table-stack">
              <thead><tr><th>{t("tableName")}</th><th>{t("tableEmail")}</th><th>{t("tableRole")}</th><th>{t("tableTeam")}</th><th>{t("tableStatus")}</th></tr></thead>
              <tbody>
                {companyProfiles.map((profile) => (
                  <tr key={profile.id}>
                    <td><strong>{getName(profile, tc("gethUser"))}</strong></td>
                    <td data-label={t("tableEmail")}>{profile.email ?? tc("noEmail")}</td>
                    <td data-label={t("tableRole")}>{profile.role.replace("_", " ")}</td>
                    <td data-label={t("tableTeam")}>{profile.team_id ? teamMap.get(profile.team_id) ?? t("assignedTeam") : tc("unassigned")}</td>
                    <td data-label={t("tableStatus")}><StatusPill raw={profile.status ?? "active"}>{profile.status ?? "active"}</StatusPill></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        ) : (
          <EmptyState title={t("emptyNoProfilesTitle")} copy={t("emptyNoProfilesCopy")} />
        )}
      </Panel>
    </DashboardShell>
  );
}
