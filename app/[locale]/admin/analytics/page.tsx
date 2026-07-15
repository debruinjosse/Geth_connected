import { redirect } from "next/navigation";
import { BarChart3, Building2, CreditCard, Download, UsersRound } from "lucide-react";
import { BarChart } from "@/components/BarChart";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { platformGrowthPoints, superAdminUser, teamComparison } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string | null, lastName: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "GA";
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default async function AdminAnalyticsPage() {
  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="admin" title="Platform analytics" subtitle="Monitor adoption, volume, and recognition energy across the full ecosystem." user={superAdminUser} actions={<span className="quality-pill">Demo fallback</span>}>
        <section className="dashboard-grid two">
          <article className="panel dashboard-panel">
            <div className="panel-top"><h2>Monthly recognitions</h2></div>
            <BarChart items={["Apr", "May", "Jun", "Jul"].map((label, index) => ({ label, value: platformGrowthPoints[index] ?? 0, color: "var(--theme-ink)" }))} />
          </article>
          <article className="panel dashboard-panel">
            <div className="panel-top"><h2>Top company volume</h2></div>
            {teamComparison.map((team) => (
              <div className="bar-row" key={team.label}>
                <span>{team.label}</span>
                <div className="bar-track"><span style={{ width: `${team.value / 1.3}%`, background: "var(--theme-ink)" }} /></div>
                <strong>{team.value}</strong>
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
    .select("first_name, last_name, role")
    .eq("id", user.id)
    .maybeSingle<{ first_name: string | null; last_name: string | null; role: string }>();

  if (profileError || !profile || !["platform_admin", "super_admin"].includes(profile.role)) {
    redirect("/auth/repair-profile");
  }

  const [
    { data: companies, error: companiesError },
    { data: profiles, error: profilesError },
    { data: recognitions, error: recognitionsError },
    { data: cards, error: cardsError },
    { data: subscriptions, error: subscriptionsError }
  ] = await Promise.all([
    supabase.from("companies").select("id, company_name"),
    supabase.from("profiles").select("id, role"),
    supabase.from("recognition_events").select("id, company_id, created_at"),
    supabase.from("card_library").select("id, active"),
    supabase.from("subscriptions").select("id, status")
  ]);

  if (companiesError || profilesError || recognitionsError || cardsError || subscriptionsError) {
    throw new Error("Failed to load platform analytics.");
  }

  const monthWindows = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(new Date().getFullYear(), new Date().getMonth() - (5 - index), 1);
    return { key: getMonthKey(date), label: new Intl.DateTimeFormat("en", { month: "short" }).format(date) };
  });
  const monthlyCounts = new Map(monthWindows.map((month) => [month.key, 0]));
  const companyCounts = new Map<string, number>();
  for (const recognition of recognitions ?? []) {
    const key = getMonthKey(new Date(recognition.created_at));
    if (monthlyCounts.has(key)) monthlyCounts.set(key, (monthlyCounts.get(key) ?? 0) + 1);
    companyCounts.set(recognition.company_id, (companyCounts.get(recognition.company_id) ?? 0) + 1);
  }

  const companyNameMap = new Map((companies ?? []).map((company) => [company.id, company.company_name]));
  const topCompanies = Array.from(companyCounts.entries())
    .map(([companyId, value]) => ({ label: companyNameMap.get(companyId) ?? "Unknown company", value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const roleCounts = new Map<string, number>();
  for (const profileRow of profiles ?? []) {
    roleCounts.set(profileRow.role, (roleCounts.get(profileRow.role) ?? 0) + 1);
  }
  const roleRows = Array.from(roleCounts.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <DashboardShell
      role="admin"
      title="Platform analytics"
      subtitle="Monitor adoption, volume, and recognition energy across the full ecosystem."
      user={{
        name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "GETH Admin",
        initials: getInitials(profile.first_name, profile.last_name),
        team: "GETH Platform"
      }}
      actions={<a className="btn btn-secondary" href="/admin/analytics/export"><Download size={16} /> Export CSV</a>}
    >
      <section className="metrics-grid">
        <MetricCard icon={<Building2 />} value={companies?.length ?? 0} label="Companies" helper="Total workspaces" />
        <MetricCard icon={<UsersRound />} value={profiles?.length ?? 0} label="Users" helper="All profiles" />
        <MetricCard icon={<BarChart3 />} value={recognitions?.length ?? 0} label="Recognitions" helper="Claimed events" />
        <MetricCard icon={<CreditCard />} value={cards?.filter((card) => card.active).length ?? 0} label="Active cards" helper={`${subscriptions?.length ?? 0} subscriptions`} />
      </section>

      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>Monthly recognitions</h2></div>
          {recognitions?.length ? (
            <BarChart items={monthWindows.map((month) => ({ label: month.label, value: monthlyCounts.get(month.key) ?? 0, color: "var(--theme-ink)" }))} />
          ) : (
            <EmptyState title="No recognitions yet" copy="Platform recognition trend will appear once companies start claiming cards." />
          )}
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>Top company volume</h2></div>
          {topCompanies.length ? (
            topCompanies.map((company) => (
              <div className="bar-row" key={company.label}>
                <span>{company.label}</span>
                <div className="bar-track"><span style={{ width: `${Math.max(8, company.value * 12)}%`, background: "var(--theme-ink)" }} /></div>
                <strong>{company.value}</strong>
              </div>
            ))
          ) : (
            <EmptyState title="No company activity yet" copy="Company activity rankings will populate after recognition events are created." />
          )}
        </article>
      </section>

      <article className="panel dashboard-panel">
        <div className="panel-top">
          <div>
            <h2>Privacy-safe recognition export</h2>
            <p>Download grouped recognition data by company, giver user ID, receiver user ID, and card. Names, emails, and personal notes are excluded.</p>
          </div>
        </div>
        <form className="table-toolbar" action="/admin/analytics/export" method="get">
          <label className="form-field">
            <span>From</span>
            <input className="input" type="date" name="from" />
          </label>
          <label className="form-field">
            <span>To</span>
            <input className="input" type="date" name="to" />
          </label>
          <button className="btn btn-dark" type="submit">
            <Download size={16} /> Download grouped CSV
          </button>
        </form>
      </article>

      <article className="panel dashboard-panel">
        <div className="panel-top"><h2>Role distribution</h2></div>
        {roleRows.length ? (
          roleRows.map(([role, value]) => (
            <div className="bar-row" key={role}>
              <span>{role.replaceAll("_", " ")}</span>
              <div className="bar-track"><span style={{ width: `${Math.max(8, value * 16)}%`, background: "var(--theme-gold)" }} /></div>
              <strong>{value}</strong>
            </div>
          ))
        ) : (
          <EmptyState title="No users yet" copy="Role distribution will appear after profiles are created." />
        )}
      </article>
    </DashboardShell>
  );
}
