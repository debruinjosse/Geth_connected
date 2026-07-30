import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BarChart3, Bell, Building2, Clock, Download, Star, UsersRound } from "lucide-react";
import { BarChart } from "@/components/BarChart";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { LineChart } from "@/components/LineChart";
import { MetricCard } from "@/components/MetricCard";
import { SignalList } from "@/components/SignalList";
import { getCategoryDisplayName } from "@/lib/cards";
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

function formatDuration(seconds: number, notTrackedLabel: string) {
  if (!seconds) return notTrackedLabel;
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
  const t = await getTranslations({ locale, namespace: "adminPages" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const dateLocale = locale === "nl" ? "nl-NL" : "en";
  const notTrackedYet = tc("notTrackedYet");

  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="admin" title={t("analyticsTitle")} subtitle={t("analyticsSubtitle")} user={superAdminUser} actions={<span className="quality-pill">{tc("demoFallback")}</span>}>
        <section className="dashboard-grid two">
          <article className="panel dashboard-panel">
            <div className="panel-top"><h2>{t("monthlyRecognitions")}</h2></div>
            <BarChart items={["Apr", "May", "Jun", "Jul"].map((label, index) => ({ label, value: platformGrowthPoints[index] ?? 0, color: "var(--theme-ink)" }))} />
          </article>
          <article className="panel dashboard-panel">
            <div className="panel-top"><h2>{t("topCompanyVolume")}</h2></div>
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
    throw new Error(t("errLoadAnalytics"));
  }

  const monthWindows = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(new Date().getFullYear(), new Date().getMonth() - (5 - index), 1);
    return { key: getMonthKey(date), label: new Intl.DateTimeFormat(dateLocale, { month: "short" }).format(date) };
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
      categoryCounts.set(card.category, (categoryCounts.get(card.category) ?? 0) + 1);
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
      key: companyId,
      label: companyNameMap.get(companyId) ?? t("unknownCompany"),
      value,
      helper: t("recognizedUsersHelper", { count: companyRecognizedUsers.get(companyId)?.size ?? 0 })
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
        key: company.id,
        label: company.company_name,
        value: score,
        helper: t("companyHealthRowHelper", { cards: recognitionVolume, recognized: recognizedUsers, users })
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const maxCardUsage = Math.max(...Array.from(cardCounts.values()), 1);
  const cardRatings = (cards ?? [])
    .map((card) => {
      const count = cardCounts.get(card.id) ?? 0;
      const rating = count ? Math.max(1, Math.round((count / maxCardUsage) * 100)) : 0;
      return {
        id: card.id,
        label: `${String(card.card_number).padStart(2, "0")} ${card.title}`,
        category: card.category,
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
  const averageTimePerView = pageViewsByPath.size ? formatDuration(Math.round(totalTrackedSeconds / Math.max(safeAnalyticsEvents.filter((event) => event.event_type === "page_view").length, 1)), notTrackedYet) : notTrackedYet;
  const topPages = Array.from(pageViewsByPath.entries())
    .map(([path, value]) => ({ key: path, label: path, value, helper: formatDuration(timeByPath.get(path) ?? 0, notTrackedYet) }))
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
      title: t("platformHealthSignalTitle", { score: healthScore }),
      detail: healthScore >= 70 ? t("platformHealthGoodDetail") : t("platformHealthWatchDetail")
    },
    {
      id: "card-balance",
      tone: unusedCardCount ? "var(--theme-gold)" : "var(--theme-emerald)",
      title: t("cardBalanceSignalTitle", { unused: unusedCardCount, total: cards?.length ?? 0 }),
      detail: unusedCardCount ? t("cardBalanceUnusedDetail") : t("cardBalanceAllUsedDetail")
    },
    {
      id: "morale-standards",
      tone: "var(--theme-emerald)",
      title: t("moraleStandardTitle"),
      detail: t("moraleStandardDetail")
    }
  ];

  return (
    <DashboardShell
      role="admin"
      title={t("analyticsTitle")}
      subtitle={t("analyticsSubtitle")}
      user={{
        name: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "GETH Admin",
        initials: getInitials(profile.first_name, profile.last_name),
        team: tc("platformTeam")
      }}
      actions={<a className="btn btn-secondary" href={`/${locale}/admin/analytics/export`}><Download size={16} /> {t("exportCsv")}</a>}
      unreadNotifications={unreadNotifications}
    >
      <section className="metrics-grid">
        <MetricCard icon={<Building2 />} value={companies?.length ?? 0} label={t("metricCompanies")} helper={t("metricTotalWorkspaces")} />
        <MetricCard icon={<UsersRound />} value={profiles?.length ?? 0} label={t("metricUsers")} helper={t("metricAllProfiles")} />
        <MetricCard icon={<BarChart3 />} value={recognitions?.length ?? 0} label={t("metricCardsGiven")} helper={t("metricAvgPerUser", { count: averageCardsPerUser })} />
        <MetricCard icon={<Star />} value={`${healthScore}/100`} label={t("metricHealthScore")} helper={t("metricActiveCompanies", { count: activeCompanyCount })} tone="var(--theme-emerald)" iconBackground="rgba(58, 166, 95, 0.12)" />
        <MetricCard icon={<Clock />} value={formatDuration(totalTrackedSeconds, notTrackedYet)} label={t("metricTimeTracked")} helper={t("metricAvgPerView", { value: averageTimePerView })} tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
        <MetricCard icon={<Bell />} value={unreadOperationalNotifications} label={t("metricUnreadUpdates")} helper={t("metricUpdatesThisWeek", { count: recentNotifications })} tone="var(--theme-sky)" iconBackground="rgba(47, 119, 184, 0.12)" />
      </section>

      <section className="dashboard-grid three report-summary-grid admin-report-summary-grid">
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">{t("mostUsedCardEyebrow")}</span>
          <strong>{topCard?.label ?? t("noCardsYet")}</strong>
          <p>{topCard ? t("cardUsesRating", { count: topCard.count, rating: topCard.rating }) : t("liveCardRatingsCopy")}</p>
        </article>
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">{t("lowestUsedCardEyebrow")}</span>
          <strong>{lowestCard?.label ?? t("noCardsYet")}</strong>
          <p>{lowestCard ? t("cardUsesRating", { count: lowestCard.count, rating: lowestCard.rating }) : t("noLiveCardUsageCopy")}</p>
        </article>
        <article className="panel dashboard-panel report-summary-card">
          <span className="eyebrow">{t("invoiceValueEyebrow")}</span>
          <strong>{new Intl.NumberFormat(dateLocale, { style: "currency", currency: "EUR" }).format(invoiceRevenueCents / 100)}</strong>
          <p>{t("subscriptionRecords", { count: subscriptions?.length ?? 0 })}</p>
        </article>
      </section>

      <section className="dashboard-grid two admin-analytics-grid">
        <article className="panel dashboard-panel admin-chart-panel">
          <div className="panel-top"><div><h2>{t("monthlyRecognitions")}</h2><p>{t("monthlyRecognitionsCopy")}</p></div></div>
          {recognitions?.length ? (
            <LineChart
              points={monthWindows.map((month) => monthlyCounts.get(month.key) ?? 0)}
              labels={monthWindows.map((month) => month.label)}
              color="var(--theme-ink)"
              ariaLabel={t("chartAriaMonthlyRecognition")}
              showValues
            />
          ) : (
            <EmptyState title={t("emptyNoRecognitionsAnalyticsTitle")} copy={t("emptyNoRecognitionsAnalyticsCopy")} />
          )}
        </article>
        <article className="panel dashboard-panel admin-ranking-panel">
          <div className="panel-top"><h2>{t("topCompanyVolume")}</h2></div>
          {topCompanies.length ? (
            <BarChart items={topCompanies.map((company) => ({ ...company, color: "var(--theme-ink)" }))} />
          ) : (
            <EmptyState title={t("emptyNoCompanyActivityTitle")} copy={t("emptyNoCompanyActivityCopy")} />
          )}
        </article>
      </section>

      <section className="dashboard-grid two admin-analytics-grid">
        <article className="panel dashboard-panel admin-chart-panel">
          <div className="panel-top"><div><h2>{t("userGrowthTitle")}</h2><p>{t("userGrowthAnalyticsCopy")}</p></div></div>
          {profiles?.length ? (
            <LineChart points={monthWindows.map((month) => monthlyUserCounts.get(month.key) ?? 0)} labels={monthWindows.map((month) => month.label)} color="var(--theme-gold)" />
          ) : (
            <EmptyState title={t("emptyNoUsersTitle")} copy={t("emptyNoUsersCopy")} />
          )}
        </article>
        <article className="panel dashboard-panel admin-ranking-panel">
          <div className="panel-top"><h2>{t("pageViewsTitle")}</h2></div>
          {safeAnalyticsEvents.length ? (
            <BarChart items={monthWindows.map((month) => ({ label: month.label, value: monthlyPageViews.get(month.key) ?? 0, color: "var(--theme-sky)" }))} />
          ) : (
            <EmptyState title={t("emptyTimeTrackingTitle")} copy={t("emptyTimeTrackingCopy")} />
          )}
        </article>
      </section>

      <section className="dashboard-grid two admin-analytics-grid">
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>{t("companyHealthTitle")}</h2></div>
          {companyHealthRows.length ? (
            <BarChart items={companyHealthRows.map((company) => ({ ...company, color: company.value >= 70 ? "var(--theme-emerald)" : company.value >= 40 ? "var(--theme-gold)" : "var(--theme-red)", valueLabel: `${company.value}/100` }))} />
          ) : (
            <EmptyState title={t("emptyCompanyHealthTitle")} copy={t("emptyCompanyHealthCopy")} />
          )}
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>{t("operationalInsightsTitle")}</h2></div>
          <SignalList items={platformSignals} />
        </article>
      </section>

      <section className="dashboard-grid two admin-analytics-grid">
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>{t("categoryDistributionTitle")}</h2></div>
          {categoryCounts.size ? (
            <BarChart items={Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label: getCategoryDisplayName(label), value, color: "var(--theme-emerald)" }))} />
          ) : (
            <EmptyState title={t("emptyCategoryTitle")} copy={t("emptyCategoryCopy")} />
          )}
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>{t("claimOriginTitle")}</h2></div>
          {claimOriginCounts.size ? (
            <BarChart items={Array.from(claimOriginCounts.entries()).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label: label.replaceAll("_", " "), value, color: label === "qr_scan" ? "var(--theme-gold)" : "var(--theme-ink)" }))} />
          ) : (
            <EmptyState title={t("emptyClaimOriginTitle")} copy={t("emptyClaimOriginCopy")} />
          )}
        </article>
      </section>

      <section className="dashboard-grid two admin-analytics-grid">
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>{t("topPagesTitle")}</h2></div>
          {topPages.length ? (
            <BarChart items={topPages.map((page) => ({ ...page, color: "var(--theme-sky)" }))} />
          ) : (
            <EmptyState title={t("emptyPageUsageTitle")} copy={t("emptyPageUsageCopy")} />
          )}
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>{t("platformReachTitle")}</h2></div>
          <BarChart
            items={[
              { label: t("reachReceivers"), value: receiverUserIds.size, color: "var(--theme-emerald)", helper: t("reachReceiversHelper") },
              { label: t("reachGivers"), value: giverUserIds.size, color: "var(--theme-gold)", helper: t("reachGiversHelper") },
              { label: t("reachActiveCompanies"), value: activeCompanyCount, color: "var(--theme-ink)", helper: t("reachActiveCompaniesHelper") },
              { label: t("reachActiveCards"), value: cards?.filter((card) => card.active).length ?? 0, color: "var(--theme-sky)", helper: t("reachActiveCardsHelper") }
            ]}
          />
        </article>
      </section>

      <article className="panel dashboard-panel admin-export-panel">
        <div className="panel-top">
          <div>
            <h2>{t("exportTitle")}</h2>
            <p>{t("exportCopy")}</p>
          </div>
        </div>
        <form className="table-toolbar" action={`/${locale}/admin/analytics/export`} method="get">
          <label className="form-field">
            <span>{t("dateFrom")}</span>
            <input className="input" type="date" name="from" />
          </label>
          <label className="form-field">
            <span>{t("dateTo")}</span>
            <input className="input" type="date" name="to" />
          </label>
          <button className="btn btn-dark" type="submit">
            <Download size={16} /> {t("downloadGroupedCsv")}
          </button>
        </form>
      </article>

      <section className="dashboard-grid two admin-analytics-grid">
      <article className="panel dashboard-panel">
        <div className="panel-top"><h2>{t("roleDistributionTitle")}</h2></div>
        {roleRows.length ? (
          roleRows.map(([role, value]) => (
            <div className="bar-row" key={role}>
              <span>{role.replaceAll("_", " ")}</span>
              <div className="bar-track"><span style={{ width: `${Math.max(8, value * 16)}%`, background: "var(--theme-gold)" }} /></div>
              <strong>{value}</strong>
            </div>
          ))
        ) : (
          <EmptyState title={t("emptyNoUsersTitle")} copy={t("emptyRoleDistributionCopy")} />
        )}
      </article>
      <article className="panel dashboard-panel">
        <div className="panel-top"><h2>{t("allCardsRatingsTitle")}</h2></div>
        {cardRatings.length ? (
          <div className="table-wrap">
            <table className="dashboard-table">
              <thead><tr><th>{t("tableCard")}</th><th>{t("tableCategory")}</th><th>{t("tableUses")}</th><th>{t("tableRating")}</th><th>{t("tableStatus")}</th></tr></thead>
              <tbody>
                {cardRatings.map((card) => (
                  <tr key={card.id}>
                    <td><strong>{card.label}</strong></td>
                    <td>{getCategoryDisplayName(card.category)}</td>
                    <td>{card.count}</td>
                    <td>{card.rating}/100</td>
                    <td>{card.active ? t("cardStatusActive") : t("cardStatusInactive")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={t("emptyCardsSeededTitle")} copy={t("emptyCardsSeededCopy")} />
        )}
      </article>
      </section>
    </DashboardShell>
  );
}
