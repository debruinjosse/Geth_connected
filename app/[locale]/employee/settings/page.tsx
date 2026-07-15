import { redirect } from "next/navigation";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { AccountSettingsPanel } from "@/components/AccountSettingsPanel";
import { DashboardShell } from "@/components/DashboardShell";
import { currentUser } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "EM";
}

export default async function EmployeeSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ settings?: string }>;
}) {
  const [{ settings }, locale] = await Promise.all([searchParams, getLocale()]);
  const returnTo = `/${locale}/employee/settings`;

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
    .select("first_name, last_name, email, status, company_id, team_id, profile_image")
    .eq("id", user.id)
    .maybeSingle<{
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      status: string | null;
      company_id: string | null;
      team_id: string | null;
      profile_image: string | null;
    }>();

  if (error || !profile) redirect("/auth/repair-profile");

  const [{ data: company }, { data: team }] = await Promise.all([
    profile.company_id
      ? supabase.from("companies").select("company_name").eq("id", profile.company_id).maybeSingle<{ company_name: string }>()
      : Promise.resolve({ data: null }),
    profile.team_id
      ? supabase.from("teams").select("name").eq("id", profile.team_id).maybeSingle<{ name: string }>()
      : Promise.resolve({ data: null })
  ]);
  const name = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "GETH user";

  return (
    <DashboardShell role="employee" title="Settings" subtitle="Account settings and workspace access." user={{ name, initials: getInitials(profile.first_name, profile.last_name), team: team?.name ?? company?.company_name ?? "GETH", imageUrl: profile.profile_image }}>
      <section className="dashboard-grid two">
        <AccountSettingsPanel
          email={profile.email ?? user.email ?? "No email"}
          firstName={profile.first_name ?? ""}
          lastName={profile.last_name ?? ""}
          profileImageUrl={profile.profile_image}
          returnTo={returnTo}
          statusCode={settings}
        />
        <SettingsPanels email={profile.email ?? user.email ?? "No email"} company={company?.company_name ?? "No company"} team={team?.name ?? "Unassigned"} status={profile.status ?? "active"} />
      </section>
    </DashboardShell>
  );
}

function SettingsPanels({ email, company, team, status }: { email: string; company: string; team: string; status: string }) {
  return (
    <>
      <article className="panel dashboard-panel">
        <h2>Account access</h2>
        <div className="profile-stack">
          <div><strong>Email</strong><p>{email}</p></div>
          <div><strong>Status</strong><p>{status}</p></div>
          <div><strong>Sign-in method</strong><p>Password and optional Supabase magic link</p></div>
        </div>
        <div className="settings-action-row">
          <Link className="btn btn-primary" href="/reset-password">Change password</Link>
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
    </>
  );
}
