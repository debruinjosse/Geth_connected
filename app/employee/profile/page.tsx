import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { currentUser, employeeTopQualities } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "EM";
}

export default async function EmployeeProfilePage() {
  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="employee" title="Profile" subtitle="Personal details, visible strengths, and the identity behind your recognition." user={currentUser}>
        <ProfilePanels name={currentUser.name} email={currentUser.email} team={currentUser.team} company="ABC Company" role="Employee" status="Demo" />
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
      <DashboardShell role="employee" title="Profile" subtitle="Personal details, visible strengths, and the identity behind your recognition." user={currentUser}>
        <ProfilePanels name={currentUser.name} email={currentUser.email} team={currentUser.team} company="ABC Company" role="Employee" status="Demo" />
      </DashboardShell>
    );
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, role, status, company:companies(company_name), team:teams!profiles_team_id_fkey(name)")
    .eq("id", user.id)
    .maybeSingle<{
      first_name: string;
      last_name: string;
      email: string;
      role: string;
      status: string;
      company: { company_name: string } | Array<{ company_name: string }> | null;
      team: { name: string } | Array<{ name: string }> | null;
    }>();

  if (error || !profile) redirect("/auth/repair-profile");

  const company = Array.isArray(profile.company) ? profile.company[0] : profile.company;
  const team = Array.isArray(profile.team) ? profile.team[0] : profile.team;
  const name = `${profile.first_name} ${profile.last_name}`.trim();

  return (
    <DashboardShell
      role="employee"
      title="Profile"
      subtitle="Personal details, visible strengths, and the identity behind your recognition."
      user={{ name, initials: getInitials(profile.first_name, profile.last_name), team: team?.name ?? company?.company_name ?? "GETH" }}
    >
      <ProfilePanels name={name} email={profile.email} team={team?.name ?? "Unassigned"} company={company?.company_name ?? "No company"} role={profile.role.replace("_", " ")} status={profile.status} />
    </DashboardShell>
  );
}

function ProfilePanels({
  name,
  email,
  team,
  company,
  role,
  status
}: {
  name: string;
  email: string;
  team: string;
  company: string;
  role: string;
  status: string;
}) {
  return (
    <section className="dashboard-grid two">
      <article className="panel dashboard-panel">
        <div className="panel-top">
          <h2>Profile details</h2>
        </div>
        <div className="profile-stack">
          <div><strong>Name</strong><p>{name}</p></div>
          <div><strong>Email</strong><p>{email}</p></div>
          <div><strong>Company</strong><p>{company}</p></div>
          <div><strong>Team</strong><p>{team}</p></div>
          <div><strong>Role</strong><p>{role}</p></div>
          <div><strong>Status</strong><p>{status}</p></div>
        </div>
      </article>
      <article className="panel dashboard-panel">
        <div className="panel-top">
          <h2>Recognized strengths</h2>
        </div>
        <div className="quality-pills">
          {employeeTopQualities.map((quality) => (
            <span className="quality-pill" key={quality.label} style={{ color: quality.tone }}>
              {quality.label}
            </span>
          ))}
        </div>
      </article>
    </section>
  );
}
