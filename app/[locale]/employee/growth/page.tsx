import { redirect } from "next/navigation";
import { BarChart } from "@/components/BarChart";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { QualityBars, type QualityBarItem } from "@/components/QualityBars";
import { categoryMeta, getCategoryDisplayName, getLocalizedCardTitle, type CardCategory } from "@/lib/cards";
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

const fourCCategories: CardCategory[] = ["Communication", "Creativity", "Competence", "Collegiality"];

export default async function EmployeeGrowthPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="employee" title="Growth story" subtitle="Watch your qualities and recognition signals evolve over time." user={currentUser} actions={<span className="quality-pill">Demo fallback</span>}>
        <section className="dashboard-grid two">
          <article className="panel dashboard-panel">
            <div className="panel-top"><h2>Recognition activity</h2></div>
            <BarChart items={["Jul", "Aug", "Sep"].map((label, index) => ({ label, value: employeeGrowthPoints[index] ?? 0, color: "var(--theme-emerald)" }))} />
          </article>
          <article className="panel dashboard-panel">
            <div className="panel-top"><h2>Four C category distribution</h2></div>
            <BarChart items={employeeCategoryBreakdown.map((item) => ({ label: item.label, value: item.value, color: item.color }))} />
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
    .select("first_name, last_name, team_id")
    .eq("id", user.id)
    .maybeSingle<{
      first_name: string | null;
      last_name: string | null;
      team_id: string | null;
    }>();

  if (profileError || !profile) redirect("/auth/repair-profile");

  const [{ data: team }, { data: rows, error: rowsError }, unreadNotifications] = await Promise.all([
    profile.team_id
      ? supabase.from("teams").select("name").eq("id", profile.team_id).maybeSingle<{ name: string }>()
      : Promise.resolve({ data: null }),
    supabase
      .from("recognition_events")
      .select("id, created_at, card:card_library(title, category, card_number, qr_slug)")
      .eq("receiver_user_id", user.id)
      .order("created_at", { ascending: true }),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  if (rowsError) throw new Error("Failed to load employee growth data.");

  const recognitions = (rows ?? []) as Array<{
    id: string;
    created_at: string;
    card: { title: string; category: string; card_number?: number | null; qr_slug?: string | null } | Array<{ title: string; category: string; card_number?: number | null; qr_slug?: string | null }> | null;
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
    const category = card.category;
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    const label = getLocalizedCardTitle({ title: card.title, slug: card.qr_slug ?? undefined }, locale);
    const existing = qualityCounts.get(label);
    qualityCounts.set(label, { value: (existing?.value ?? 0) + 1, category });
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
          <div className="panel-top"><h2>Recognition activity</h2></div>
          {recognitions.length ? (
            <BarChart items={monthWindows.map((month) => ({ label: month.label, value: monthlyCounts.get(month.key) ?? 0, color: "var(--theme-emerald)" }))} />
          ) : (
            <EmptyState title="No growth trend yet" copy="Recognition history will create your growth chart over time." actionLabel="Browse cards" actionHref="/cards" />
          )}
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>Four C category distribution</h2></div>
          {categoryRows.length ? (
            <BarChart
              items={fourCCategories.map((category) => ({
                label: getCategoryDisplayName(category),
                value: categoryCounts.get(category) ?? 0,
                color: categoryMeta[category].color
              }))}
            />
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
