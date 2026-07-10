import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { LineChart } from "@/components/LineChart";
import { QualityBars, type QualityBarItem } from "@/components/QualityBars";
import { categoryMeta, getCategoryDisplayName } from "@/lib/cards";
import { currentUser, employeeCategoryBreakdown, employeeGrowthPoints } from "@/lib/demo-data";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "GU";
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default async function EmployeeGrowthPage() {
  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="employee" title="Growth story" subtitle="Watch your qualities and recognition signals evolve over time." user={currentUser} actions={<span className="quality-pill">Demo fallback</span>}>
        <section className="dashboard-grid two">
          <article className="panel dashboard-panel">
            <div className="panel-top"><h2>Growth trend</h2></div>
            <LineChart color="var(--theme-emerald)" points={employeeGrowthPoints} labels={["Jul", "Aug", "Sep"]} />
          </article>
          <article className="panel dashboard-panel">
            <div className="panel-top"><h2>Category distribution</h2></div>
            {employeeCategoryBreakdown.map((item) => (
              <div className="bar-row" key={item.label}>
                <span>{item.label}</span>
                <div className="bar-track"><span style={{ width: `${item.value * 14}%`, background: item.color }} /></div>
                <strong>{item.value}</strong>
              </div>
            ))}
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name, team:teams(name)")
    .eq("id", user.id)
    .maybeSingle<{
      first_name: string | null;
      last_name: string | null;
      team: { name: string } | Array<{ name: string }> | null;
    }>();

  if (profileError || !profile) redirect("/login?error=missing_profile");

  const [{ data: rows, error: rowsError }, unreadNotifications] = await Promise.all([
    supabase
      .from("recognition_events")
      .select("id, created_at, card:card_library(title, category)")
      .eq("receiver_user_id", user.id)
      .order("created_at", { ascending: true }),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  if (rowsError) throw new Error("Failed to load employee growth data.");

  const recognitions = (rows ?? []) as Array<{
    id: string;
    created_at: string;
    card: { title: string; category: string } | Array<{ title: string; category: string }> | null;
  }>;

  const monthWindows = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(new Date().getFullYear(), new Date().getMonth() - (5 - index), 1);
    return { key: getMonthKey(date), label: new Intl.DateTimeFormat("en", { month: "short" }).format(date) };
  });
  const monthlyCounts = new Map(monthWindows.map((month) => [month.key, 0]));
  const categoryCounts = new Map<string, number>();
  const qualityCounts = new Map<string, { value: number; category: string }>();

  for (const recognition of recognitions) {
    const card = Array.isArray(recognition.card) ? recognition.card[0] : recognition.card;
    if (!card) continue;
    const monthKey = getMonthKey(new Date(recognition.created_at));
    if (monthlyCounts.has(monthKey)) monthlyCounts.set(monthKey, (monthlyCounts.get(monthKey) ?? 0) + 1);
    categoryCounts.set(card.category, (categoryCounts.get(card.category) ?? 0) + 1);
    const existing = qualityCounts.get(card.title);
    qualityCounts.set(card.title, { value: (existing?.value ?? 0) + 1, category: card.category });
  }

  const categoryRows = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]);
  const qualityRows: QualityBarItem[] = Array.from(qualityCounts.entries())
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 6)
    .map(([label, info]) => ({
      label,
      value: recognitions.length ? Math.round((info.value / recognitions.length) * 100) : 0,
      category: info.category
    }));

  const team = Array.isArray(profile.team) ? profile.team[0] : profile.team;

  return (
    <DashboardShell
      role="employee"
      title="Growth story"
      subtitle="Watch your qualities and recognition signals evolve over time."
      user={{
        name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "GETH user",
        initials: getInitials(profile.first_name, profile.last_name),
        team: team?.name ?? "No team assigned"
      }}
      actions={<span className="quality-pill">Live growth</span>}
      unreadNotifications={unreadNotifications}
    >
      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>Growth trend</h2></div>
          {recognitions.length ? (
            <LineChart color="var(--theme-emerald)" points={monthWindows.map((month) => monthlyCounts.get(month.key) ?? 0)} labels={monthWindows.map((month) => month.label)} />
          ) : (
            <EmptyState title="No growth trend yet" copy="Recognition history will create your growth chart over time." actionLabel="Browse cards" actionHref="/cards" />
          )}
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>Category distribution</h2></div>
          {categoryRows.length ? (
            categoryRows.map(([category, value]) => (
              <div className="bar-row" key={category}>
                <span>{getCategoryDisplayName(category)}</span>
                <div className="bar-track">
                  <span style={{ width: `${Math.max(8, (value / recognitions.length) * 100)}%`, background: categoryMeta[category as keyof typeof categoryMeta]?.color ?? "var(--theme-ink)" }} />
                </div>
                <strong>{value}</strong>
              </div>
            ))
          ) : (
            <EmptyState title="No categories yet" copy="Claimed recognition cards will show your category spread here." />
          )}
        </article>
      </section>
      <article className="panel dashboard-panel">
        <div className="panel-top"><h2>Top qualities</h2></div>
        {qualityRows.length ? <QualityBars items={qualityRows} /> : <EmptyState title="No qualities yet" copy="Your most recognized strengths will appear here as you receive cards." />}
      </article>
    </DashboardShell>
  );
}
