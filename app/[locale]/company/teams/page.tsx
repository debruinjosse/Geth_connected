import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
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

const DAY_MS = 24 * 60 * 60 * 1000;
const WORKFORCE_ROLES = new Set(["employee", "manager"]);

type TeamMemberRow = {
  id: string;
  team_id: string | null;
  role: string;
  status: string | null;
};

type TeamRecognitionRow = {
  id: string;
  team_id: string | null;
  receiver_user_id: string;
  giver_user_id: string | null;
  claimed_at: string | null;
  created_at: string;
};

function isActiveWorkforceMember(member: TeamMemberRow) {
  return WORKFORCE_ROLES.has(member.role) && member.status === "active";
}

function getRecognitionDate(recognition: TeamRecognitionRow) {
  return new Date(recognition.claimed_at ?? recognition.created_at);
}

function getActivityUserIds(recognitions: TeamRecognitionRow[], workforceIds: Set<string>) {
  const activeIds = new Set<string>();

  for (const recognition of recognitions) {
    if (workforceIds.has(recognition.receiver_user_id)) {
      activeIds.add(recognition.receiver_user_id);
    }

    if (recognition.giver_user_id && workforceIds.has(recognition.giver_user_id)) {
      activeIds.add(recognition.giver_user_id);
    }
  }

  return activeIds;
}

function renderDemoTeams(t: Awaited<ReturnType<typeof getTranslations>>) {
  return (
    <DashboardShell role="company" title={t("teamsTitle")} subtitle={t("teamsSubtitle")} user={companyAdmin}>
      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="table-wrap">
            <table className="dashboard-table">
              <thead><tr><th>{t("team")}</th><th>Members</th><th>{t("manager")}</th><th>Engagement</th><th>Recognitions</th></tr></thead>
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
        <InlineDemoForm
          title={t("createTeam")}
          description={t("createFirstTeamCopy")}
          buttonLabel={t("createTeam")}
          fields={[
            { id: "team-name", label: t("teamName"), placeholder: "Customer Success" },
            { id: "team-manager", label: t("manager"), placeholder: "Lisa Jansen" }
          ]}
        />
      </section>
    </DashboardShell>
  );
}

export default async function CompanyTeamsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "companyPages" });
  const tc = await getTranslations({ locale, namespace: "common" });

  if (!hasSupabaseServerConfig()) {
    return renderDemoTeams(t);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return renderDemoTeams(t);
  }

  const { data: adminProfile, error: adminError } = await supabase
    .from("profiles")
    .select("id, company_id, first_name, last_name, role")
    .eq("id", user.id)
    .maybeSingle<{ id: string; company_id: string | null; first_name: string; last_name: string; role: string }>();

  if (adminError || !adminProfile?.company_id || adminProfile.role !== "company_admin") {
    redirect("/auth/repair-profile");
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
        .select("id, team_id, role, status")
        .eq("company_id", adminProfile.company_id),
      supabase
        .from("recognition_events")
        .select("id, team_id, receiver_user_id, giver_user_id, claimed_at, created_at")
        .eq("company_id", adminProfile.company_id)
    ]);

  if (teamsError || managersError || membersError || recognitionsError) {
    throw new Error("Failed to load company team data.");
  }

  const currentStart = new Date(Date.now() - 30 * DAY_MS);
  const activeMembers = ((members ?? []) as TeamMemberRow[]).filter(isActiveWorkforceMember);
  const activeMemberIds = new Set(activeMembers.map((member) => member.id));
  const membersByTeam = new Map<string, Set<string>>();

  for (const team of teams ?? []) {
    membersByTeam.set(team.id, new Set<string>());
  }

  for (const member of activeMembers) {
    if (member.team_id && membersByTeam.has(member.team_id)) {
      membersByTeam.get(member.team_id)?.add(member.id);
    }
  }

  const recognitionCountsByTeam = new Map<string, number>();
  const currentRecognitions = ((recognitions ?? []) as TeamRecognitionRow[]).filter((recognition) => {
    const date = getRecognitionDate(recognition);
    return date >= currentStart;
  });

  for (const recognition of (recognitions ?? []) as TeamRecognitionRow[]) {
    if (recognition.team_id) {
      recognitionCountsByTeam.set(recognition.team_id, (recognitionCountsByTeam.get(recognition.team_id) ?? 0) + 1);
    }
  }

  const tableRows = (teams ?? []).map((team) => {
    const manager = Array.isArray(team.manager) ? team.manager[0] : team.manager;
    const teamMemberIds = membersByTeam.get(team.id) ?? new Set<string>();

    if (team.manager_id && activeMemberIds.has(team.manager_id)) {
      teamMemberIds.add(team.manager_id);
    }

    const recognitionCount = recognitionCountsByTeam.get(team.id) ?? 0;
    const activeTeamMemberIds = getActivityUserIds(
      currentRecognitions.filter(
        (recognition) =>
          teamMemberIds.has(recognition.receiver_user_id) ||
          Boolean(recognition.giver_user_id && teamMemberIds.has(recognition.giver_user_id))
      ),
      teamMemberIds
    );
    const memberCount = teamMemberIds.size;
    const engagement = memberCount ? `${Math.round((activeTeamMemberIds.size / memberCount) * 100)}%` : "0%";

    return {
      id: team.id,
      name: team.name,
      managerId: team.manager_id,
      managerName: manager ? `${manager.first_name} ${manager.last_name}`.trim() : tc("unassigned"),
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
      title={t("teamsTitle")}
      subtitle={t("teamsSubtitle")}
      user={{
        name: `${adminProfile.first_name} ${adminProfile.last_name}`.trim(),
        initials: getInitials(adminProfile.first_name, adminProfile.last_name),
        team: t("companyAdmin")
      }}
      actions={<span className="quality-pill">{tc("liveData")}</span>}
    >
      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="table-wrap">
            {tableRows.length ? (
              <table className="dashboard-table">
                <thead><tr><th>{t("team")}</th><th>Members</th><th>{t("manager")}</th><th>Engagement</th><th>Recognitions</th></tr></thead>
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
                eyebrow={t("noTeamsEyebrow")}
                title={t("createFirstTeamTitle")}
                copy={t("createFirstTeamCopy")}
              />
            )}
          </div>
        </article>

        <TeamManagementPanel teams={tableRows} managers={managerOptions} />
      </section>
    </DashboardShell>
  );
}
