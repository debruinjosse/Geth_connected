import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { InlineDemoForm } from "@/components/InlineDemoForm";
import { TeamManagementPanel } from "@/components/TeamManagementPanel";
import { companyAdmin, companyTeams } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "CA";
}

function renderDemoTeams() {
  return (
    <DashboardShell role="company" title="Teams" subtitle="Create, compare, and support recognition activity across every team." user={companyAdmin}>
      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="table-wrap">
            <table className="dashboard-table">
              <thead><tr><th>Team</th><th>Members</th><th>Manager</th><th>Engagement</th><th>Recognitions</th></tr></thead>
              <tbody>
                {companyTeams.map((team) => (
                  <tr key={team.id}>
                    <td><strong>{team.name}</strong></td>
                    <td>{team.members}</td>
                    <td>{team.manager}</td>
                    <td>{team.engagement}</td>
                    <td>{team.recognitions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <InlineDemoForm title="Create team" description="Use this demo form to test a future team-creation workflow." buttonLabel="Create team" fields={[{ id: "team-name", label: "Team name", placeholder: "Customer Success" }, { id: "team-manager", label: "Manager", placeholder: "Lisa Jansen" }]} />
      </section>
    </DashboardShell>
  );
}

export default async function CompanyTeamsPage() {
  if (!hasSupabaseServerConfig()) {
    return renderDemoTeams();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return renderDemoTeams();
  }

  const { data: adminProfile, error: adminError } = await supabase
    .from("profiles")
    .select("id, company_id, first_name, last_name, role")
    .eq("id", user.id)
    .maybeSingle<{ id: string; company_id: string | null; first_name: string; last_name: string; role: string }>();

  if (adminError || !adminProfile?.company_id || adminProfile.role !== "company_admin") {
    redirect("/login?error=missing_profile");
  }

  const [{ data: teams, error: teamsError }, { data: managers, error: managersError }, { data: members, error: membersError }, { data: recognitions, error: recognitionsError }] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id, name, manager_id, manager:profiles!teams_manager_id_fkey(id, first_name, last_name)")
        .eq("company_id", adminProfile.company_id)
        .order("name"),
      supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("company_id", adminProfile.company_id)
        .eq("role", "manager")
        .order("first_name"),
      supabase
        .from("profiles")
        .select("id, team_id")
        .eq("company_id", adminProfile.company_id),
      supabase
        .from("recognition_events")
        .select("id, team_id")
        .eq("company_id", adminProfile.company_id)
    ]);

  if (teamsError || managersError || membersError || recognitionsError) {
    throw new Error("Failed to load company team data.");
  }

  const memberCountsByTeam = new Map<string, number>();
  for (const member of members ?? []) {
    if (member.team_id) {
      memberCountsByTeam.set(member.team_id, (memberCountsByTeam.get(member.team_id) ?? 0) + 1);
    }
  }

  const recognitionCountsByTeam = new Map<string, number>();
  for (const recognition of recognitions ?? []) {
    if (recognition.team_id) {
      recognitionCountsByTeam.set(recognition.team_id, (recognitionCountsByTeam.get(recognition.team_id) ?? 0) + 1);
    }
  }

  const tableRows = (teams ?? []).map((team) => {
    const manager = Array.isArray(team.manager) ? team.manager[0] : team.manager;
    const memberCount = memberCountsByTeam.get(team.id) ?? 0;
    const recognitionCount = recognitionCountsByTeam.get(team.id) ?? 0;
    const engagement = memberCount ? `${Math.min(99, Math.round((recognitionCount / memberCount) * 100))}%` : "0%";

    return {
      id: team.id,
      name: team.name,
      managerId: team.manager_id,
      managerName: manager ? `${manager.first_name} ${manager.last_name}`.trim() : "Unassigned",
      memberCount,
      engagement,
      recognitions: recognitionCount
    };
  });

  const managerOptions = (managers ?? []).map((manager) => ({
    id: manager.id,
    name: `${manager.first_name} ${manager.last_name}`.trim()
  }));

  return (
    <DashboardShell
      role="company"
      title="Teams"
      subtitle="Create, compare, and support recognition activity across every team."
      user={{
        name: `${adminProfile.first_name} ${adminProfile.last_name}`.trim(),
        initials: getInitials(adminProfile.first_name, adminProfile.last_name),
        team: "Company admin"
      }}
      actions={<span className="quality-pill">Live data</span>}
    >
      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="table-wrap">
            {tableRows.length ? (
              <table className="dashboard-table">
                <thead><tr><th>Team</th><th>Members</th><th>Manager</th><th>Engagement</th><th>Recognitions</th></tr></thead>
                <tbody>
                  {tableRows.map((team) => (
                    <tr key={team.id}>
                      <td><strong>{team.name}</strong></td>
                      <td>{team.memberCount}</td>
                      <td>{team.managerName}</td>
                      <td>{team.engagement}</td>
                      <td>{team.recognitions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState
                eyebrow="No teams yet"
                title="Create your first team"
                copy="Once you add a team here, you can assign a manager, invite members into it, and start tracking recognition momentum."
              />
            )}
          </div>
        </article>

        <TeamManagementPanel teams={tableRows} managers={managerOptions} />
      </section>
    </DashboardShell>
  );
}
