import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
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

function renderDemoEmployees() {
  return (
    <DashboardShell role="company" title="Employees" subtitle="Manage employee records, participation, and recognition visibility." user={companyAdmin}>
      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="table-wrap">
            <table className="dashboard-table">
              <thead><tr><th>Name</th><th>Role</th><th>Team</th><th>Status</th><th>Cards</th></tr></thead>
              <tbody>
                {companyEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td><strong>{employee.name}</strong></td>
                    <td>{employee.role}</td>
                    <td>{employee.team}</td>
                    <td>{employee.status}</td>
                    <td>{employee.cards}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <InlineDemoForm title="Add employee" description="Demo-safe employee creation with no backend dependency." buttonLabel="Add employee" fields={[{ id: "employee-name", label: "Full name", placeholder: "Jamie Miller" }, { id: "employee-email", label: "Email", placeholder: "jamie@company.com" }, { id: "employee-team", label: "Team", placeholder: "Marketing" }]} />
      </section>
    </DashboardShell>
  );
}

export default async function CompanyEmployeesPage() {
  if (!hasSupabaseServerConfig()) {
    return renderDemoEmployees();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return renderDemoEmployees();
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
        .select("id, first_name, last_name, email, team_id, status, role, team:teams!profiles_team_id_fkey(name)")
        .eq("company_id", adminProfile.company_id)
        .eq("role", "employee")
        .order("first_name"),
      supabase
        .from("invitations")
        .select("id, email, role, status, team_id, token, team:teams(name)")
        .eq("company_id", adminProfile.company_id)
        .eq("role", "employee")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("recognition_events")
        .select("receiver_user_id")
        .eq("company_id", adminProfile.company_id)
    ]);

  if (teamsError || employeesError || invitationsError || recognitionsError) {
    throw new Error("Failed to load company employee data.");
  }

  const recognitionCounts = new Map<string, number>();
  for (const recognition of recognitions ?? []) {
    recognitionCounts.set(recognition.receiver_user_id, (recognitionCounts.get(recognition.receiver_user_id) ?? 0) + 1);
  }

  return (
    <DashboardShell
      role="company"
      title="Employees"
      subtitle="Manage employee records, participation, and recognition visibility."
      user={{
        name: `${adminProfile.first_name} ${adminProfile.last_name}`.trim(),
        initials: getInitials(adminProfile.first_name, adminProfile.last_name),
        team: "Company admin"
      }}
    >
      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="table-wrap">
            {employees?.length || invitations?.length ? (
              <table className="dashboard-table">
                <thead><tr><th>Name</th><th>Role</th><th>Team</th><th>Status</th><th>Cards</th></tr></thead>
                <tbody>
                  {(employees ?? []).map((employee) => {
                    const team = Array.isArray(employee.team) ? employee.team[0] : employee.team;
                    return (
                      <tr key={employee.id}>
                        <td><strong>{`${employee.first_name} ${employee.last_name}`.trim()}</strong></td>
                        <td>Employee</td>
                        <td>{team?.name ?? "Unassigned"}</td>
                        <td>{employee.status}</td>
                        <td>{recognitionCounts.get(employee.id) ?? 0}</td>
                      </tr>
                    );
                  })}
                  {(invitations ?? []).map((invite) => {
                    const team = Array.isArray(invite.team) ? invite.team[0] : invite.team;
                    return (
                      <tr key={invite.id}>
                        <td><strong>{invite.email}</strong></td>
                        <td>Employee</td>
                        <td>{team?.name ?? "Assign later"}</td>
                        <td>pending invite</td>
                        <td>0</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <EmptyState
                eyebrow="No employees yet"
                title="Invite your first employee"
                copy="Create an invite link to bring a teammate into this company workspace and start tracking recognition."
              />
            )}
          </div>
        </article>
        <InvitationPanel
          title="Invite employee"
          description="Generate a secure invite link for an employee and optionally attach them to a team before they join."
          defaultRole="employee"
          teams={(teams ?? []).map((team) => ({ id: team.id, name: team.name }))}
        />
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
              role: "employee",
              teamId: employee.team_id,
              teamName: team?.name ?? "Unassigned",
              status: employee.status,
              cards: recognitionCounts.get(employee.id) ?? 0
            };
          })}
          pendingInvites={(invitations ?? []).map((invite) => {
            const team = Array.isArray(invite.team) ? invite.team[0] : invite.team;
            return {
              id: invite.id,
              email: invite.email,
              role: "employee",
              teamName: team?.name ?? "Assign later",
              inviteLink: `${getAppUrl()}/invite/${invite.token}`
            };
          })}
        />
      </section>
    </DashboardShell>
  );
}
