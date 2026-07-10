import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { currentUser } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "EM";
}

export default async function EmployeeSettingsPage() {
  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="employee" title="Settings" subtitle="Account settings and workspace access." user={currentUser}>
        <SettingsPanels email={currentUser.email} company="ABC Company" team={currentUser.team} status="Demo" />
      </DashboardShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return (
      <DashboardShell role="employee" title="Settings" subtitle="Account settings and workspace access." user={currentUser}>
        <SettingsPanels email={currentUser.email} company="ABC Company" team={currentUser.team} status="Demo" />
      </DashboardShell>
    );
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, status, company:companies(company_name), team:teams!profiles_team_id_fkey(name)")
    .eq("id", user.id)
    .maybeSingle<{
      first_name: string;
      last_name: string;
      email: string;
      status: string;
      company: { company_name: string } | Array<{ company_name: string }> | null;
      team: { name: string } | Array<{ name: string }> | null;
    }>();

  if (error || !profile) redirect("/login?error=missing_profile");

  const company = Array.isArray(profile.company) ? profile.company[0] : profile.company;
  const team = Array.isArray(profile.team) ? profile.team[0] : profile.team;
  const name = `${profile.first_name} ${profile.last_name}`.trim();

  return (
    <DashboardShell role="employee" title="Settings" subtitle="Account settings and workspace access." user={{ name, initials: getInitials(profile.first_name, profile.last_name), team: team?.name ?? company?.company_name ?? "GETH" }}>
      <SettingsPanels email={profile.email} company={company?.company_name ?? "No company"} team={team?.name ?? "Unassigned"} status={profile.status} />
    </DashboardShell>
  );
}

function SettingsPanels({ email, company, team, status }: { email: string; company: string; team: string; status: string }) {
  return (
    <section className="dashboard-grid two">
      <article className="panel dashboard-panel">
        <h2>Account access</h2>
        <div className="profile-stack">
          <div><strong>Email</strong><p>{email}</p></div>
          <div><strong>Status</strong><p>{status}</p></div>
          <div><strong>Sign-in method</strong><p>Password and optional Supabase magic link</p></div>
        </div>
        <div className="settings-action-row">
          <Link className="btn btn-primary" href="/reset-password">Change password</Link>
          <Link className="btn btn-secondary" href="/employee/notifications">Notification inbox</Link>
          <Link className="btn btn-secondary" href="/auth/signout">Sign out</Link>
        </div>
      </article>
      <article className="panel dashboard-panel">
        <h2>Workspace</h2>
        <div className="profile-stack">
          <div><strong>Company</strong><p>{company}</p></div>
          <div><strong>Team</strong><p>{team}</p></div>
          <div><strong>Profile changes</strong><p>Ask your company admin to update team or role assignments.</p></div>
        </div>
      </article>
    </section>
  );
}
