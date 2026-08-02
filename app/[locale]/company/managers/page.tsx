import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { InlineDemoForm } from "@/components/InlineDemoForm";
import { InvitationPanel } from "@/components/InvitationPanel";
import { CompanyPeopleManagementPanel } from "@/components/CompanyPeopleManagementPanel";
import { companyAdmin, companyManagers } from "@/lib/demo-data";
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

function renderDemoManagers(t: Awaited<ReturnType<typeof getTranslations>>) {
  return (
    <DashboardShell role="company" title={t("managersTitle")} subtitle={t("managersSubtitle")} user={companyAdmin}>
      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="table-wrap">
            <table className="dashboard-table">
              <thead><tr><th>{t("manager")}</th><th>{t("team")}</th><th>{t("tableMembers")}</th><th>{t("tableScore")}</th><th>{t("tableReport")}</th></tr></thead>
              <tbody>
                {companyManagers.map((manager) => (
                  <tr key={manager.id}>
                    <td><strong>{manager.name}</strong></td>
                    <td>{manager.team}</td>
                    <td>{manager.members}</td>
                    <td>{manager.score}</td>
                    <td>{manager.report}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <InlineDemoForm
          title={t("assignManager")}
          description={t("managersSubtitle")}
          buttonLabel={t("assignManager")}
          fields={[
            { id: "manager-name", label: t("manager"), placeholder: "Sarah Connors" },
            { id: "manager-team", label: t("team"), placeholder: "Marketing" }
          ]}
        />
      </section>
    </DashboardShell>
  );
}

export default async function CompanyManagersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "companyPages" });
  const tc = await getTranslations({ locale, namespace: "common" });

  if (!hasSupabaseServerConfig()) {
    return renderDemoManagers(t);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return renderDemoManagers(t);
  }

  const { data: adminProfile, error: adminError } = await supabase
    .from("profiles")
    .select("id, company_id, first_name, last_name")
    .eq("id", user.id)
    .maybeSingle<{ id: string; company_id: string | null; first_name: string; last_name: string }>();

  if (adminError || !adminProfile?.company_id) {
    redirect("/auth/repair-profile");
  }

  const [{ data: teams, error: teamsError }, { data: managers, error: managersError }, { data: invitations, error: invitationsError }, { data: members, error: membersError }, { data: recognitions, error: recognitionsError }] =
    await Promise.all([
      supabase.from("teams").select("id, name, manager_id").eq("company_id", adminProfile.company_id).order("name"),
      supabase
        .from("profiles")
        .select("id, first_name, last_name, email, team_id, status")
        .eq("company_id", adminProfile.company_id)
        .eq("role", "manager")
        .order("first_name"),
      supabase
        .from("invitations")
        .select("id, email, status, team_id, token, team:teams(name)")
        .eq("company_id", adminProfile.company_id)
        .eq("role", "manager")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, team_id").eq("company_id", adminProfile.company_id),
      supabase.from("recognition_events").select("team_id, receiver_user_id").eq("company_id", adminProfile.company_id)
    ]);

  if (teamsError || managersError || invitationsError || membersError || recognitionsError) {
    throw new Error("Failed to load company manager data.");
  }

  const teamList = teams ?? [];
  const memberRows = members ?? [];
  const recognitionRows = recognitions ?? [];

  const memberCountsByTeam = new Map<string, number>();
  for (const member of memberRows) {
    if (member.team_id) {
      memberCountsByTeam.set(member.team_id, (memberCountsByTeam.get(member.team_id) ?? 0) + 1);
    }
  }

  const recognitionCountsByTeam = new Map<string, number>();
  for (const recognition of recognitionRows) {
    if (recognition.team_id) {
      recognitionCountsByTeam.set(recognition.team_id, (recognitionCountsByTeam.get(recognition.team_id) ?? 0) + 1);
    }
  }

  return (
    <DashboardShell
      role="company"
      title={t("managersTitle")}
      subtitle={t("managersSubtitle")}
      user={{
        name: `${adminProfile.first_name} ${adminProfile.last_name}`.trim(),
        initials: getInitials(adminProfile.first_name, adminProfile.last_name),
        team: t("companyAdmin")
      }}
    >
      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="table-wrap">
            {(managers?.length || invitations?.length) ? (
              <table className="dashboard-table">
                <thead><tr><th>{t("manager")}</th><th>{t("team")}</th><th>{t("tableMembers")}</th><th>{t("tableScore")}</th><th>{t("tableReport")}</th></tr></thead>
                <tbody>
                  {(managers ?? []).map((manager) => {
                    const managedTeams = teamList.filter((team) => team.manager_id === manager.id);
                    const managedTeam = managedTeams[0];
                    const memberCount = managedTeams.reduce((sum, team) => sum + (memberCountsByTeam.get(team.id) ?? 0), 0);
                    const recognitionCount = managedTeams.reduce((sum, team) => sum + (recognitionCountsByTeam.get(team.id) ?? 0), 0);
                    const score = memberCount ? `${Math.round((recognitionCount / memberCount) * 100)}%` : "0%";
                    const report = recognitionCount >= 6 ? t("reportStrongMomentum") : recognitionCount >= 2 ? t("reportHealthyCollaboration") : t("reportNeedsRecognition");

                    return (
                      <tr key={manager.id}>
                        <td><strong>{`${manager.first_name} ${manager.last_name}`.trim()}</strong></td>
                        <td>{managedTeam?.name ?? tc("unassigned")}</td>
                        <td>{memberCount}</td>
                        <td>{score}</td>
                        <td>{manager.status === "active" ? report : manager.status}</td>
                      </tr>
                    );
                  })}
                  {(invitations ?? []).map((invite) => {
                    const team = Array.isArray(invite.team) ? invite.team[0] : invite.team;
                    return (
                      <tr key={invite.id}>
                        <td><strong>{invite.email}</strong></td>
                        <td>{team?.name ?? tc("assignLater")}</td>
                        <td>0</td>
                        <td>{t("invitePending")}</td>
                        <td>{t("awaitingAcceptance")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <EmptyState
                eyebrow={t("noManagersEyebrow")}
                title={t("inviteFirstManagerTitle")}
                copy={t("inviteFirstManagerCopy")}
              />
            )}
          </div>
        </article>
        <InvitationPanel
          title={t("inviteManager")}
          description={t("inviteFirstManagerCopy")}
          defaultRole="manager"
          teams={teamList.map((team) => ({ id: team.id, name: team.name }))}
        />
      </section>
      <section className="section-shell dashboard-section-tight">
        <CompanyPeopleManagementPanel
          mode="manager"
          teams={teamList.map((team) => ({ id: team.id, name: team.name, managerId: team.manager_id }))}
          people={(managers ?? []).map((manager) => {
            const managedTeams = teamList.filter((team) => team.manager_id === manager.id);
            const defaultTeam = teamList.find((team) => team.id === manager.team_id);
            return {
              id: manager.id,
              name: `${manager.first_name} ${manager.last_name}`.trim(),
              email: manager.email,
              role: "manager",
              teamId: manager.team_id,
              teamName: defaultTeam?.name ?? tc("unassigned"),
              status: manager.status,
              managedTeamIds: managedTeams.map((team) => team.id)
            };
          })}
          pendingInvites={(invitations ?? []).map((invite) => {
            const team = Array.isArray(invite.team) ? invite.team[0] : invite.team;
            return {
              id: invite.id,
              email: invite.email,
              role: "manager",
              teamName: team?.name ?? tc("assignLater"),
              inviteLink: `${getAppUrl()}/invite/${invite.token}`
            };
          })}
        />
      </section>
    </DashboardShell>
  );
}
