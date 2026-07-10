import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { LineChart } from "@/components/LineChart";
import { QualityBars } from "@/components/QualityBars";
import { managerTrendPoints, managerUser, topQualities } from "@/lib/demo-data";
import { getManagerInsights } from "@/lib/data/manager-insights";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "MG";
}

export default async function ManagerAnalyticsPage() {
  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="manager" title="Analytics" subtitle="Recognition health, quality spread, and impact signals for the quarter." user={managerUser} actions={<span className="quality-pill">Demo fallback</span>}>
        <section className="dashboard-grid two">
          <article className="panel dashboard-panel">
            <div className="panel-top"><h2>Trend line</h2></div>
            <LineChart color="var(--theme-ink)" points={managerTrendPoints} labels={["Jul", "Aug", "Sep"]} />
          </article>
          <article className="panel dashboard-panel">
            <div className="panel-top"><h2>Qualities mix</h2></div>
            <QualityBars items={topQualities} />
          </article>
        </section>
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
      title="Analytics"
      subtitle="Recognition health, quality spread, and impact signals for the quarter."
      user={{
        name: `${insights.profile.first_name ?? ""} ${insights.profile.last_name ?? ""}`.trim() || "Manager",
        initials: getInitials(insights.profile.first_name, insights.profile.last_name),
        team: insights.teamLabel
      }}
      actions={<span className="quality-pill">{insights.recognitionCount} recognitions</span>}
      unreadNotifications={unreadNotifications}
    >
      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>Trend line</h2></div>
          {insights.recognitionCount ? (
            <LineChart color="var(--theme-ink)" points={insights.trendPoints} labels={insights.trendLabels} />
          ) : (
            <EmptyState title="No trend yet" copy="Team recognition trend will appear after recognitions are claimed." />
          )}
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>Qualities mix</h2></div>
          {insights.qualityBars.length ? <QualityBars items={insights.qualityBars} /> : <EmptyState title="No qualities yet" copy="Claimed cards will reveal your team's strongest qualities." />}
        </article>
      </section>
      <article className="panel dashboard-panel">
        <div className="panel-top"><h2>Member comparison</h2></div>
        {insights.memberComparison.length ? (
          insights.memberComparison.map((member) => (
            <div className="bar-row" key={member.label}>
              <span>{member.label}</span>
              <div className="bar-track"><span style={{ width: `${Math.max(8, member.value * 18)}%`, background: "var(--theme-ink)" }} /></div>
              <strong>{member.value}</strong>
            </div>
          ))
        ) : (
          <EmptyState title="No member comparison yet" copy="Once team members receive recognitions, comparison bars will appear here." />
        )}
      </article>
    </DashboardShell>
  );
}
