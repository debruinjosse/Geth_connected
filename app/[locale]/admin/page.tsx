import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Building2, CreditCard, QrCode, Sparkles, UsersRound } from "lucide-react";
import { BarChart } from "@/components/BarChart";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { superAdminUser } from "@/lib/demo-data";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "GA";
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default async function AdminDashboardPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <DashboardShell role="admin" title="Platform overview" subtitle="Supabase is not configured yet." user={superAdminUser}>
        <EmptyState title="Connect Supabase to activate platform admin" copy="The platform admin dashboard reads live companies, users, cards, and recognition data once Supabase env vars are configured." />
      </DashboardShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name, role")
    .eq("id", user.id)
    .maybeSingle<{ first_name: string; last_name: string; role: string }>();

  if (profileError || !profile || !["platform_admin", "super_admin"].includes(profile.role)) {
    redirect("/auth/repair-profile");
  }
  const unreadNotifications = await getUnreadNotificationCount(supabase, user.id);

  const [
    { count: companyCount },
    { count: profileCount },
    { count: recognitionCount },
    { count: cardCount },
    { data: companies },
    { data: recognitions }
  ] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("recognition_events").select("id", { count: "exact", head: true }),
    supabase.from("card_library").select("id", { count: "exact", head: true }),
    supabase.from("companies").select("id, company_name, subscription_plan, status, created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("recognition_events").select("created_at").order("created_at", { ascending: false }).limit(500)
  ]);

  const monthWindows = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(new Date().getFullYear(), new Date().getMonth() - (5 - index), 1);
    return {
      key: getMonthKey(date),
      label: new Intl.DateTimeFormat("en", { month: "short" }).format(date)
    };
  });
  const monthlyCounts = new Map<string, number>();
  for (const recognition of recognitions ?? []) {
    const key = getMonthKey(new Date(recognition.created_at));
    monthlyCounts.set(key, (monthlyCounts.get(key) ?? 0) + 1);
  }

  const trendPoints = monthWindows.map((month) => monthlyCounts.get(month.key) ?? 0);

  return (
    <DashboardShell
      role="admin"
      title="Platform overview"
      subtitle="Monitor company health, subscriptions, card routes, and recognition activity."
      user={{
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        initials: getInitials(profile.first_name, profile.last_name),
        team: "GETH Platform"
      }}
      actions={<span className="quality-pill">Live platform data</span>}
      unreadNotifications={unreadNotifications}
    >
      <section className="metrics-grid">
        <MetricCard icon={<Building2 />} value={companyCount ?? 0} label="Companies" helper="Tenant workspaces" />
        <MetricCard icon={<UsersRound />} value={profileCount ?? 0} label="Users" helper="All platform profiles" />
        <MetricCard icon={<BarChart3 />} value={recognitionCount ?? 0} label="Recognitions" helper="Claimed events" tone="var(--theme-emerald)" iconBackground="rgba(58, 166, 95, 0.12)" />
        <MetricCard icon={<CreditCard />} value={cardCount ?? 0} label="Cards" helper="Library templates" tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
      </section>

      <section className="dashboard-grid two admin-overview-graphics">
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <div>
              <h2>Recognition activity</h2>
              <p>Platform recognition volume across recent months.</p>
            </div>
            <Link className="quality-pill" href="/admin/analytics">Analytics</Link>
          </div>
          {recognitionCount ? (
            <BarChart items={monthWindows.map((month, index) => ({ label: month.label, value: trendPoints[index] ?? 0, color: "var(--theme-ink)" }))} />
          ) : (
            <EmptyState title="No platform recognitions yet" copy="Recognition activity will appear here as companies start claiming cards." />
          )}
        </article>

        <article className="panel dashboard-panel">
          <div className="panel-top">
            <div>
              <h2>Quick actions</h2>
              <p>Jump to the key platform controls.</p>
            </div>
          </div>
          <div className="admin-action-grid">
            <Link className="btn btn-secondary" href="/admin/companies"><Building2 size={16} /> Companies</Link>
            <Link className="btn btn-secondary" href="/admin/cards"><Sparkles size={16} /> Card library</Link>
            <Link className="btn btn-secondary" href="/admin/qr-routes"><QrCode size={16} /> QR routes</Link>
            <Link className="btn btn-secondary" href="/admin/subscriptions"><CreditCard size={16} /> Subscriptions</Link>
          </div>
        </article>
      </section>

      <article className="panel dashboard-panel">
        <div className="panel-top">
          <div>
            <h2>Recent companies</h2>
            <p>Latest tenant workspaces in the platform.</p>
          </div>
          <Link href="/admin/companies" className="panel-link">View all</Link>
        </div>
        {companies?.length ? (
          <div className="table-wrap">
            <table className="dashboard-table">
              <thead><tr><th>Company</th><th>Plan</th><th>Status</th><th>Created</th></tr></thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td><strong>{company.company_name}</strong></td>
                    <td>{company.subscription_plan}</td>
                    <td>{company.status}</td>
                    <td>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(company.created_at))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No companies yet" copy="Company workspaces will appear here after company admins sign up or you seed test accounts." />
        )}
      </article>
    </DashboardShell>
  );
}
