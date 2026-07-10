import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { SignalList } from "@/components/SignalList";
import { managerUser, teamSignals } from "@/lib/demo-data";
import { getManagerInsights } from "@/lib/data/manager-insights";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "MG";
}

export default async function ManagerSignalsPage() {
  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="manager" title="Team signals" subtitle="Spot celebration gaps, upward trends, and people who need support." user={managerUser} actions={<span className="quality-pill">Demo fallback</span>}>
        <article className="panel dashboard-panel"><SignalList items={teamSignals} /></article>
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
    if (error instanceof Error && error.message === "missing_profile") redirect("/auth/repair-profile");
    throw error;
  }

  const unreadNotifications = await getUnreadNotificationCount(supabase, user.id);

  return (
    <DashboardShell
      role="manager"
      title="Team signals"
      subtitle="Spot celebration gaps, upward trends, and people who need support."
      user={{
        name: `${insights.profile.first_name ?? ""} ${insights.profile.last_name ?? ""}`.trim() || "Manager",
        initials: getInitials(insights.profile.first_name, insights.profile.last_name),
        team: insights.teamLabel
      }}
      actions={<span className="quality-pill">{insights.signalItems.length} signals</span>}
      unreadNotifications={unreadNotifications}
    >
      <article className="panel dashboard-panel">
        {insights.signalItems.length ? (
          <SignalList items={insights.signalItems} />
        ) : (
          <EmptyState title="No team signals yet" copy="Signals will appear when recognition activity creates gaps, risks, or momentum worth surfacing." />
        )}
      </article>
    </DashboardShell>
  );
}
