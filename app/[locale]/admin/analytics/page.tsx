import { redirect } from "next/navigation";
import { Activity, Award, BarChart3, Bell, Building2, Clock, CreditCard, Download, Sparkles, Star, UsersRound } from "lucide-react";
import { BarChart } from "@/components/BarChart";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { LineChart } from "@/components/LineChart";
import { MetricCard } from "@/components/MetricCard";
import { SignalList } from "@/components/SignalList";
import { getCanonicalCardBySlugOrNumber, getCategoryDisplayName } from "@/lib/cards";
import { platformGrowthPoints, superAdminUser, teamComparison } from "@/lib/demo-data";
import { getUnreadNotificationCount } from "@/lib/notifications";
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

function getPercent(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

function formatDuration(seconds: number) {
  if (!seconds) return "Not tracked yet";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function getHealthScore({
  companyCount,
  activeCompanyCount,
  profileCount,
  recognitionCount,
  recognizedUserCount,
  activeCardCount,
  totalCardCount
}: {
  companyCount: number;
  activeCompanyCount: number;
  profileCount: number;
  recognitionCount: number;
  recognizedUserCount: number;
  activeCardCount: number;
  totalCardCount: number;
}) {
  const companyActivity = getPercent(activeCompanyCount, Math.max(companyCount, 1));
  const recognitionDensity = Math.min(100, Math.round((recognitionCount / Math.max(profileCount, 1)) * 20));
  const userReach = getPercent(recognizedUserCount, Math.max(profileCount, 1));
  const cardReadiness = getPercent(activeCardCount, Math.max(totalCardCount, 1));
  return Math.round(companyActivity * 0.3 + recognitionDensity * 0.3 + userReach * 0.25 + cardReadiness * 0.15);
}

export default async function AdminAnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

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
  if (userError || !user) redirect(`/${locale}/login`);

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
    { data: subscriptions, error: subscriptionsError },
    { data: notifications, error: notificationsError },
    { data: invoices, error: invoicesError },
    { data: analyticsEvents, error: analyticsEventsError },
    unreadNotifications
  ] = await Promise.all([
    supabase.from("companies").select("id, company_name, status, subscription_plan, subscription_status, created_at"),
    supabase.from("profiles").select("id, role, company_id, status, created_at"),
    supabase.from("recognition_events").select("id, company_id, giver_user_id, receiver_user_id, card_id, claim_origin, created_at, card:card_library(title, category, card_number, qr_slug)"),
    supabase.from("card_library").select("id, card_number, title, category, qr_slug, active").order("card_number"),
    supabase.from("subscriptions").select("id, status, payment_method, invoice_status"),
    supabase.from("notifications").select("id, type, read_at, created_at").order("created_at", { ascending: false }).limit(500),
    supabase.from("billing_invoices").select("id, status, total_cents, currency, created_at").order("created_at", { ascending: false }).limit(500),
    supabase.from("platform_analytics_events").select("event_type, duration_seconds, path, company_id, created_at").order("created_at", { ascending: false }).limit(2000),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  if (companiesError || profilesError || recognitionsError || cardsError || subscriptionsError || notificationsError || invoicesError) {
    throw new Error("Failed to load platform analytics.");
  }

  const monthWindows = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(new Date().getFullYear(), new Date().getMonth() - (5 - index), 1);
    return { key: getMonthKey(date), label: new Intl.DateTimeFormat("en", { month: "short" }).format(date) };
  });
  const monthlyCounts = new Map(monthWindows.map((month) => [month.key, 0]));
  const monthlyUserCounts = new Map(monthWindows.map((month) => [month.key, 0]));
  const monthlyPageViews = new Map(monthWindows.map((month) => [month.key, 0]));
  const companyCounts = new Map<string, number>();
  const companyRecognizedUsers = new Map<string, Set<string>>();
  const cardCounts = new Map<string | number, number>();
  const categoryCounts = new Map<string, number>();
  const claimOriginCounts = new Map<string, number>();
  const giverUserIds = new Set<string>();
  const receiverUserIds = new Set<string>();

  for (const recognition of recognitions ?? []) {
    const key = getMonthKey(new Date(recognition.created_at));
    if (monthlyCounts.has(key)) monthlyCounts.set(key, (monthlyCounts.get(key) ?? 0) + 1);
    companyCounts.set(recognition.company_id, (companyCounts.get(recognition.company_id) ?? 0) + 1);
    if (!companyRecognizedUsers.has(recognition.company_id)) companyRecognizedUsers.set(recognition.company_id, new Set());
    companyRecognizedUsers.get(recognition.company_id)!.add(recognition.receiver_user_id);
    cardCounts.set(recognition.card_id, (cardCounts.get(recognition.card_id) ?? 0) + 1);
    const card = Array.isArray(recognition.card) ? recognition.card[0] : recognition.card;
    if (card) {
      const canonicalCard = getCanonicalCardBySlugOrNumber(card.card_number, card.qr_slug);
      const category = canonicalCard?.category ?? card.category;
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }
    claimOriginCounts.set(recognition.claim_origin ?? "direct_link", (claimOriginCounts.get(recognition.claim_origin ?? "direct_link") ?? 0) + 1);
    if (recognition.giver_user_id) giverUserIds.add(recognition.giver_user_id);
    receiverUserIds.add(recognition.receiver_user_id);
  }

  for (const profileRow of profiles ?? []) {
    const key = getMonthKey(new Date(profileRow.created_at));
    if (monthlyUserCounts.has(key)) monthlyUserCounts.set(key, (monthlyUserCounts.get(key) ?? 0) + 1);
  }

  const safeAnalyticsEvents = analyticsEventsError ? [] : analyticsEvents ?? [];
  let totalTrackedSeconds = 0;
  const pageViewsByPath = new Map<string, number>();
  const timeByPath = new Map<string, number>();
  for (const event of safeAnalyticsEvents) {
    const key = getMonthKey(new Date(event.created_at));
    if (event.event_type === "page_view") {
      if (monthlyPageViews.has(key)) monthlyPageViews.set(key, (monthlyPageViews.get(key) ?? 0) + 1);
      pageViewsByPath.set(event.path, (pageViewsByPath.get(event.path) ?? 0) + 1);
    }
    if (event.event_type === "time_spent") {
      const seconds = event.duration_seconds ?? 0;
      totalTrackedSeconds += seconds;
      timeByPath.set(event.path, (timeByPath.get(event.path) ?? 0) + seconds);
    }
  }

  const companyNameMap = new Map((companies ?? []).map((company) => [company.id, company.company_name]));
  const profileCountByCompany = new Map<string, number>();
  for (const profileRow of profiles ?? []) {
    if (!profileRow.company_id) continue;
    profileCountByCompany.set(profileRow.company_id, (profileCountByCompany.get(profileRow.company_id) ?? 0) + 1);
  }

  const topCompanies = Array.from(companyCounts.entries())
    .map(([companyId, value]) => ({
      label: companyNameMap.get(companyId) ?? "Unknown company",
      value,
      helper: `${companyRecognizedUsers.get(companyId)?.size ?? 0} recognized users`
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const companyHealthRows = (companies ?? [])
    .map((company) => {
      const users = profileCountByCompany.get(company.id) ?? 0;
      const recognitionVolume = companyCounts.get(company.id) ?? 0;
      const recognizedUsers = companyRecognizedUsers.get(company.id)?.size ?? 0;
      const score = Math.round(getPercent(recognizedUsers, Math.max(users, 1)) * 0.55 + Math.min(100, recognitionVolume * 10) * 0.45);
      return {
        label: company.company_name,
        value: score,
        helper: `${recognitionVolume} cards, ${recognizedUsers}/${users} recognized users`
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const maxCardUsage = Math.max(...Array.from(cardCounts.values()), 1);
  const cardRatings = (cards ?? [])
    .map((card) => {
      const canonicalCard = getCanonicalCardBySlugOrNumber(card.card_number, card.qr_slug);
      const count = cardCounts.get(card.id) ?? 0;
      const rating = count ? Math.max(1, Math.round((count / maxCardUsage) * 100)) : 0;
      return {
        id: card.id,
        label: `${String(card.card_number).padStart(2, "0")} ${canonicalCard?.title ?? card.title}`,
        category: canonicalCard?.category ?? card.category,
        count,
        rating,
        active: card.active
      };
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const topCard = cardRatings[0];
  const lowestCard = [...cardRatings].sort((a, b) => a.count - b.count || a.label.localeCompare(b.label))[0];
  const unusedCardCount = cardRatings.filter((card) => card.count === 0).length;
  const activeCompanyCount = Array.from(companyCounts.keys()).length;
  const unreadOperationalNotifications = (notifications ?? []).filter((notification) => !notification.read_at).length;
  const recentNotifications = (notifications ?? []).filter((notification) => Date.now() - new Date(notification.created_at).getTime() <= 7 * 24 * 60 * 60 * 1000).length;
  const invoiceRevenueCents = (invoices ?? []).reduce((sum, invoice) => sum + (invoice.status === "issued" || invoice.status === "paid" ? invoice.total_cents ?? 0 : 0), 0);
  const healthScore = getHealthScore({
    companyCount: companies?.length ?? 0,
    activeCompanyCount,
    profileCount: profiles?.length ?? 0,
    recognitionCount: recognitions?.length ?? 0,
    recognizedUserCount: receiverUserIds.size,
    activeCardCount: cards?.filter((card) => card.active).length ?? 0,
    totalCardCount: cards?.length ?? 0
  });
  const averageCardsPerUser = profiles?.length ? ((recognitions?.length ?? 0) / profiles.length).toFixed(1) : "0.0";
  const averageTimePerView = pageViewsByPath.size ? formatDuration(Math.round(totalTrackedSeconds / Math.max(safeAnalyticsEvents.filter((event) => event.event_type === "page_view").length, 1))) : "Not tracked yet";
  const topPages = Array.from(pageViewsByPath.entries())
    .map(([path, value]) => ({ label: path, value, helper: formatDuration(timeByPath.get(path) ?? 0) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const roleCounts = new Map<string, number>();
  for (const profileRow of profiles ?? []) {
    roleCounts.set(profileRow.role, (roleCounts.get(profileRow.role) ?? 0) + 1);
  }
  const roleRows = Array.from(roleCounts.entries()).sort((a, b) => b[1] - a[1]);
  const platformSignals = [
    {
      id: "morale-health",
      tone: healthScore >= 70 ? "var(--theme-emerald)" : healthScore >= 45 ? "var(--theme-gold)" : "var(--theme-red)",
      title: `Platform health score: ${healthScore}/100`,
      detail: healthScore >= 70 ? "Recognition adoption is healthy. Keep celebrating visible, respectful peer recognition." : "Watch company adoption, low-card usage, and users who have not yet received recognition."
    },
    {
      id: "card-balance",
      tone: unusedCardCount ? "var(--theme-gold)" : "var(--theme-emerald)",
      title: `${unusedCardCount} of ${cards?.length ?? 0} cards have no usage yet`,
      detail: unusedCardCount ? "Rotate low-used cards into demos and onboarding so every quality is represented." : "All cards have live recognition usage."
    },
    {
      id: "morale-standards",
      tone: "var(--theme-emerald)",
      title: "Morale standard",
      detail: "Encourage recognition that is specific, kind, peer-validated, and never used for ranking people negatively."
    }
  ];

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
      actions={<a className="btn btn-secondary" href={`/${locale}/admin/analytics/export`}><Download size={16} /> Export CSV</a>}
      unreadNotifications={unreadNotifications}
    >
      <section className="metrics-grid">
        <MetricCard icon={<Building2 />} value={companies?.length ?? 0} label="Companies" helper="Total workspaces" />
        <MetricCard icon={<UsersRound />} value={profiles?.length ?? 0} label="Users" helper="All profiles" />
        <MetricCard icon={<BarChart3 />} value={recognitions?.length ?? 0} label="Cards given" helper={`${averageCardsPerUser} avg per user`} />
        <MetricCard icon={<Star />} value={`${healthScore}/100`} label="Health score" helper={`${activeCompanyCount} active companies`} tone="var(--theme-emerald)" iconBackground="rgba(58, 166, 95, 0.12)" />
        <MetricCard icon={<Clock />} value={formatDuration(totalTrackedSeconds)} label="Time tracked" helper={`Avg ${averageTimePerView} per view`} tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
        <MetricCard icon={<Bell />} value={unreadOperationalNotifications} label="Unread updates" helper={`${recentNotifications} updates this week`} tone="var(--theme-sky)" iconBackground="rgba(47, 119, 184, 0.12)" />
      </section>

      <section className="dashboard-grid three report-summary-grid admin-report-summary-grid">
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">Most used card</span>
          <strong>{topCard?.label ?? "No cards yet"}</strong>
          <p>{topCard ? `${topCard.count} uses, ${topCard.rating}/100 rating` : "Live card ratings appear after claims."}</p>
        </article>
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">Lowest-used card</span>
          <strong>{lowestCard?.label ?? "No cards yet"}</strong>
          <p>{lowestCard ? `${lowestCard.count} uses, ${lowestCard.rating}/100 rating` : "No live card usage yet."}</p>
        </article>
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">Invoice value</span>
          <strong>{new Intl.NumberFormat("en", { style: "currency", currency: "EUR" }).format(invoiceRevenueCents / 100)}</strong>
          <p>{subscriptions?.length ?? 0} subscription records</p>
        </article>
      </section>

      <section className="dashboard-grid two admin-analytics-grid">
        <article className="panel dashboard-panel admin-chart-panel">
          <div className="panel-top"><div><h2>Monthly recognitions</h2><p>Latest six months, oldest to newest.</p></div></div>
          {recognitions?.length ? (
            <LineChart
              points={monthWindows.map((month) => monthlyCounts.get(month.key) ?? 0)}
              labels={monthWindows.map((month) => month.label)}
              color="var(--theme-ink)"
              ariaLabel="Monthly recognition volume over the latest six months"
              showValues
            />
          ) : (
            <EmptyState title="No recognitions yet" copy="Platform recognition trend will appear once companies start claiming cards." />
          )}
        </article>
        <article className="panel dashboard-panel admin-ranking-panel">
          <div className="panel-top"><h2>Top company volume</h2></div>
          {topCompanies.length ? (
            <BarChart items={topCompanies.map((company) => ({ ...company, color: "var(--theme-ink)" }))} />
          ) : (
            <EmptyState title="No company activity yet" copy="Company activity rankings will populate after recognition events are created." />
          )}
        </article>
      </section>

      <section className="dashboard-grid two admin-analytics-grid">
        <article className="panel dashboard-panel admin-chart-panel">
          <div className="panel-top"><div><h2>User growth</h2><p>New profiles created in the latest six months.</p></div></div>
          {profiles?.length ? (
            <LineChart points={monthWindows.map((month) => monthlyUserCounts.get(month.key) ?? 0)} labels={monthWindows.map((month) => month.label)} color="var(--theme-gold)" />
          ) : (
            <EmptyState title="No users yet" copy="User growth will appear after accounts are created." />
          )}
        </article>
        <article className="panel dashboard-panel admin-ranking-panel">
          <div className="panel-top"><h2>Page views</h2></div>
          {safeAnalyticsEvents.length ? (
            <BarChart items={monthWindows.map((month) => ({ label: month.label, value: monthlyPageViews.get(month.key) ?? 0, color: "var(--theme-sky)" }))} />
          ) : (
            <EmptyState title="Time tracking starts after migration" copy="Apply migration 013 to begin collecting page views and time spent." />
          )}
        </article>
      </section>

      <section className="dashboard-grid two admin-analytics-grid">
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>Company health</h2></div>
          {companyHealthRows.length ? (
            <BarChart items={companyHealthRows.map((company) => ({ ...company, color: company.value >= 70 ? "var(--theme-emerald)" : company.value >= 40 ? "var(--theme-gold)" : "var(--theme-red)", valueLabel: `${company.value}/100` }))} />
          ) : (
            <EmptyState title="No company health yet" copy="Company health appears after users and recognitions exist." />
          )}
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>Operational insights</h2></div>
          <SignalList items={platformSignals} />
        </article>
      </section>

      <section className="dashboard-grid two admin-analytics-grid">
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>Category distribution</h2></div>
          {categoryCounts.size ? (
            <BarChart items={Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label: getCategoryDisplayName(label), value, color: "var(--theme-emerald)" }))} />
          ) : (
            <EmptyState title="No category data yet" copy="Recognition categories appear after cards are claimed." />
          )}
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>Claim origin</h2></div>
          {claimOriginCounts.size ? (
            <BarChart items={Array.from(claimOriginCounts.entries()).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label: label.replaceAll("_", " "), value, color: label === "qr_scan" ? "var(--theme-gold)" : "var(--theme-ink)" }))} />
          ) : (
            <EmptyState title="No claim origins yet" copy="QR, direct link, and manual entry origins appear after claims." />
          )}
        </article>
      </section>

      <section className="dashboard-grid two admin-analytics-grid">
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>Top pages by live usage</h2></div>
          {topPages.length ? (
            <BarChart items={topPages.map((page) => ({ ...page, color: "var(--theme-sky)" }))} />
          ) : (
            <EmptyState title="No page usage yet" copy="Page usage will populate after visitors browse the deployed site with migration 013 applied." />
          )}
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>Platform reach</h2></div>
          <BarChart
            items={[
              { label: "Receivers", value: receiverUserIds.size, color: "var(--theme-emerald)", helper: "Users who received cards" },
              { label: "Givers", value: giverUserIds.size, color: "var(--theme-gold)", helper: "Users who gave cards" },
              { label: "Active companies", value: activeCompanyCount, color: "var(--theme-ink)", helper: "Companies with recognition volume" },
              { label: "Active cards", value: cards?.filter((card) => card.active).length ?? 0, color: "var(--theme-sky)", helper: "Cards available to claim" }
            ]}
          />
        </article>
      </section>

      <article className="panel dashboard-panel admin-export-panel">
        <div className="panel-top">
          <div>
            <h2>Privacy-safe recognition export</h2>
            <p>Download grouped recognition data by company, giver user ID, receiver user ID, and card. Names, emails, and personal notes are excluded.</p>
          </div>
        </div>
        <form className="table-toolbar" action={`/${locale}/admin/analytics/export`} method="get">
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

      <section className="dashboard-grid two admin-analytics-grid">
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
      <article className="panel dashboard-panel">
        <div className="panel-top"><h2>All 53 card ratings</h2></div>
        {cardRatings.length ? (
          <div className="table-wrap">
            <table className="dashboard-table">
              <thead><tr><th>Card</th><th>Category</th><th>Uses</th><th>Rating</th><th>Status</th></tr></thead>
              <tbody>
                {cardRatings.map((card) => (
                  <tr key={card.id}>
                    <td><strong>{card.label}</strong></td>
                    <td>{getCategoryDisplayName(card.category)}</td>
                    <td>{card.count}</td>
                    <td>{card.rating}/100</td>
                    <td>{card.active ? "active" : "inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No cards seeded" copy="The 53-card rating report appears after card_library is seeded." />
        )}
      </article>
      </section>
    </DashboardShell>
  );
}
