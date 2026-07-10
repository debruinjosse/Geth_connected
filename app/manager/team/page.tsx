import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { TeamTable } from "@/components/TeamTable";
import { managerUser, people } from "@/lib/demo-data";
import { getManagerInsights } from "@/lib/data/manager-insights";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "MG";
}

export default async function ManagerTeamPage() {
  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="manager" title="Team members" subtitle="A clear view of each person's recognition momentum." user={managerUser} actions={<span className="quality-pill">Demo fallback</span>}>
        <article className="panel dashboard-panel"><TeamTable people={people} /></article>
      </DashboardShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login");

  let insights;
  try {
    insights = await getManagerInsights(supabase, user.id);
  } catch (error) {
    if (error instanceof Error && error.message === "missing_profile") redirect("/login?error=missing_profile");
    throw error;
  }

  const unreadNotifications = await getUnreadNotificationCount(supabase, user.id);

  return (
    <DashboardShell
      role="manager"
      title="Team members"
      subtitle="A clear view of each person's recognition momentum."
      user={{
        name: `${insights.profile.first_name ?? ""} ${insights.profile.last_name ?? ""}`.trim() || "Manager",
        initials: getInitials(insights.profile.first_name, insights.profile.last_name),
        team: insights.teamLabel
      }}
      actions={<span className="quality-pill">{insights.teamRows.length} members</span>}
      unreadNotifications={unreadNotifications}
    >
      <article className="panel dashboard-panel">
        {insights.teamRows.length ? (
          <TeamTable people={insights.teamRows} />
        ) : (
          <EmptyState title="No managed team members yet" copy="Assign employees to teams managed by this profile to populate this page." />
        )}
      </article>
    </DashboardShell>
  );
}
