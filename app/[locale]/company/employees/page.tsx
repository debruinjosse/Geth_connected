import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { BulkEmployeeImportPanel } from "@/components/BulkEmployeeImportPanel";
import { InlineDemoForm } from "@/components/InlineDemoForm";
import { InvitationPanel } from "@/components/InvitationPanel";
import { CompanyPeopleManagementPanel } from "@/components/CompanyPeopleManagementPanel";
import { companyAdmin, companyEmployees } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "CA";
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function formatRole(role: string, t: Awaited<ReturnType<typeof getTranslations>>) {
  return role === "manager" ? t("roleManager") : t("roleEmployee");
}

function renderDemoEmployees(t: Awaited<ReturnType<typeof getTranslations>>) {
  return (
    <DashboardShell role="company" title={t("employeesTitle")} subtitle={t("employeesSubtitle")} user={companyAdmin}>
      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>{t("tableName")}</th>
                  <th>{t("tableRole")}</th>
                  <th>{t("tableDepartment")}</th>
                  <th>{t("team")}</th>
                  <th>{t("tableStatus")}</th>
                  <th>{t("tableCards")}</th>
                </tr>
              </thead>
              <tbody>
                {companyEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td><strong>{employee.name}</strong></td>
                    <td>{employee.role}</td>
                    <td>{employee.team}</td>
                    <td>{employee.team}</td>
                    <td>{employee.status}</td>
                    <td>{employee.cards}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <InlineDemoForm
          title={t("addEmployee")}
          description={t("employeesDemoDescription")}
          buttonLabel={t("addEmployee")}
          fields={[
            { id: "employee-name", label: t("fullName"), placeholder: "Jamie Miller" },
            { id: "employee-email", label: t("email"), placeholder: "jamie@company.com" },
            { id: "employee-team", label: t("team"), placeholder: "Marketing" }
          ]}
        />
      </section>
    </DashboardShell>
  );
}

export default async function CompanyEmployeesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "companyPages" });
  const tc = await getTranslations({ locale, namespace: "common" });

  if (!hasSupabaseServerConfig()) {
    return renderDemoEmployees(t);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return renderDemoEmployees(t);
  }

  const { data: adminProfile, error: adminError } = await supabase
    .from("profiles")
    .select("id, company_id, first_name, last_name")
    .eq("id", user.id)
    .maybeSingle<{ id: string; company_id: string | null; first_name: string; last_name: string }>();

  if (adminError || !adminProfile?.company_id) {
    redirect("/auth/repair-profile");
  }

  const [{ data: teams, error: teamsError }, { data: employees, error: employeesError }, { data: invitations, error: invitationsError }, { data: recognitions, error: recognitionsError }] =
    await Promise.all([
      supabase.from("teams").select("id, name").eq("company_id", adminProfile.company_id).order("name"),
      supabase
        .from("profiles")
        .select("id, first_name, last_name, email, team_id, department_id, status, role, team:teams!profiles_team_id_fkey(name), department:departments!profiles_department_id_fkey(name)")
        .eq("company_id", adminProfile.company_id)
        .in("role", ["employee", "manager"])
        .order("first_name"),
      supabase
        .from("invitations")
        .select("id, email, role, status, team_id, department_id, token, team:teams(name), department:departments!invitations_department_id_fkey(name)")
        .eq("company_id", adminProfile.company_id)
        .in("role", ["employee", "manager"])
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("recognition_events")
        .select("receiver_user_id")
        .eq("company_id", adminProfile.company_id)
    ]);

  if (teamsError || employeesError || invitationsError || recognitionsError) {
    throw new Error(t("errLoadEmployees"));
  }

  const recognitionCounts = new Map<string, number>();
  for (const recognition of recognitions ?? []) {
    recognitionCounts.set(recognition.receiver_user_id, (recognitionCounts.get(recognition.receiver_user_id) ?? 0) + 1);
  }

  return (
    <DashboardShell
      role="company"
      title={t("employeesTitle")}
      subtitle={t("employeesSubtitle")}
      user={{
        name: `${adminProfile.first_name} ${adminProfile.last_name}`.trim(),
        initials: getInitials(adminProfile.first_name, adminProfile.last_name),
        team: t("companyAdmin")
      }}
    >
      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="table-wrap">
            {employees?.length || invitations?.length ? (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>{t("tableName")}</th>
                    <th>{t("tableRole")}</th>
                    <th>{t("tableDepartment")}</th>
                    <th>{t("team")}</th>
                    <th>{t("tableStatus")}</th>
                    <th>{t("tableCards")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(employees ?? []).map((employee) => {
                    const team = Array.isArray(employee.team) ? employee.team[0] : employee.team;
                    const department = Array.isArray(employee.department) ? employee.department[0] : employee.department;
                    return (
                      <tr key={employee.id}>
                        <td><strong>{`${employee.first_name} ${employee.last_name}`.trim()}</strong></td>
                        <td>{formatRole(employee.role, t)}</td>
                        <td>{department?.name ?? team?.name ?? tc("unassigned")}</td>
                        <td>{team?.name ?? tc("unassigned")}</td>
                        <td>{employee.status}</td>
                        <td>{recognitionCounts.get(employee.id) ?? 0}</td>
                      </tr>
                    );
                  })}
                  {(invitations ?? []).map((invite) => {
                    const team = Array.isArray(invite.team) ? invite.team[0] : invite.team;
                    const department = Array.isArray(invite.department) ? invite.department[0] : invite.department;
                    return (
                      <tr key={invite.id}>
                        <td><strong>{invite.email}</strong></td>
                        <td>{formatRole(invite.role, t)}</td>
                        <td>{department?.name ?? team?.name ?? tc("assignLater")}</td>
                        <td>{team?.name ?? tc("assignLater")}</td>
                        <td>{tc("pendingInvite")}</td>
                        <td>0</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <EmptyState
                eyebrow={t("noEmployeesEyebrow")}
                title={t("inviteFirstEmployeeTitle")}
                copy={t("inviteFirstEmployeeCopy")}
              />
            )}
          </div>
        </article>
        <InvitationPanel
          title={t("inviteEmployee")}
          description={t("inviteEmployeeDescription")}
          defaultRole="employee"
          teams={(teams ?? []).map((team) => ({ id: team.id, name: team.name }))}
        />
      </section>
      <section className="section-shell dashboard-section-tight">
        <BulkEmployeeImportPanel />
      </section>
      <section className="section-shell dashboard-section-tight">
        <CompanyPeopleManagementPanel
          mode="employee"
          teams={(teams ?? []).map((team) => ({ id: team.id, name: team.name }))}
          people={(employees ?? []).map((employee) => {
            const team = Array.isArray(employee.team) ? employee.team[0] : employee.team;
            return {
              id: employee.id,
              name: `${employee.first_name} ${employee.last_name}`.trim(),
              email: employee.email,
              role: employee.role === "manager" ? "manager" : "employee",
              teamId: employee.team_id,
              teamName: team?.name ?? tc("unassigned"),
              status: employee.status,
              cards: recognitionCounts.get(employee.id) ?? 0
            };
          })}
          pendingInvites={(invitations ?? []).map((invite) => {
            const team = Array.isArray(invite.team) ? invite.team[0] : invite.team;
            return {
              id: invite.id,
              email: invite.email,
              role: invite.role === "manager" ? "manager" : "employee",
              teamName: team?.name ?? tc("assignLater"),
              inviteLink: `${getAppUrl()}/invite/${invite.token}`
            };
          })}
        />
      </section>
    </DashboardShell>
  );
}
