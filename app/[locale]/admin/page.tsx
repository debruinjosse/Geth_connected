import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BarChart3, Building2, CalendarCheck2, CreditCard, UsersRound } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { LineChart } from "@/components/LineChart";
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

export default async function AdminDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminPages" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const dateLocale = locale === "nl" ? "nl-NL" : "en";

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <DashboardShell role="admin" title={t("overviewTitle")} subtitle={t("overviewNoSupabaseSubtitle")} user={superAdminUser}>
        <EmptyState title={t("noSupabaseEmptyTitle")} copy={t("noSupabaseEmptyCopy")} />
      </DashboardShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/login`);
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
    { count: demoBookingCount },
    { count: pendingDemoBookingCount },
    { data: companies },
    { data: recognitions },
    { data: userRows }
  ] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("recognition_events").select("id", { count: "exact", head: true }),
    supabase.from("card_library").select("id", { count: "exact", head: true }),
    supabase.from("demo_bookings").select("id", { count: "exact", head: true }),
    supabase.from("demo_bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("companies").select("id, company_name, subscription_plan, status, created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("recognition_events").select("created_at").order("created_at", { ascending: false }).limit(500),
    supabase.from("profiles").select("created_at").order("created_at", { ascending: false }).limit(1000)
  ]);

  const monthWindows = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(new Date().getFullYear(), new Date().getMonth() - (5 - index), 1);
    return {
      key: getMonthKey(date),
      label: new Intl.DateTimeFormat(dateLocale, { month: "short" }).format(date)
    };
  });
  const monthlyCounts = new Map<string, number>();
  for (const recognition of recognitions ?? []) {
    const key = getMonthKey(new Date(recognition.created_at));
    monthlyCounts.set(key, (monthlyCounts.get(key) ?? 0) + 1);
  }

  const trendPoints = monthWindows.map((month) => monthlyCounts.get(month.key) ?? 0);
  const monthlyUserCounts = new Map<string, number>();
  for (const profileRow of userRows ?? []) {
    const key = getMonthKey(new Date(profileRow.created_at));
    monthlyUserCounts.set(key, (monthlyUserCounts.get(key) ?? 0) + 1);
  }
  const userTrendPoints = monthWindows.map((month) => monthlyUserCounts.get(month.key) ?? 0);

  return (
    <DashboardShell
      role="admin"
      title={t("overviewTitle")}
      subtitle={t("overviewSubtitle")}
      user={{
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        initials: getInitials(profile.first_name, profile.last_name),
        team: tc("platformTeam")
      }}
      actions={<span className="quality-pill">{tc("livePlatformData")}</span>}
      unreadNotifications={unreadNotifications}
    >
      <section className="metrics-grid">
        <MetricCard icon={<Building2 />} value={companyCount ?? 0} label={t("metricCompanies")} helper={t("metricCompaniesHelper")} />
        <MetricCard icon={<UsersRound />} value={profileCount ?? 0} label={t("metricUsers")} helper={t("metricUsersHelper")} />
        <MetricCard icon={<BarChart3 />} value={recognitionCount ?? 0} label={t("metricRecognitions")} helper={t("metricRecognitionsHelper")} tone="var(--theme-emerald)" iconBackground="rgba(58, 166, 95, 0.12)" />
        <MetricCard icon={<CreditCard />} value={cardCount ?? 0} label={t("metricCards")} helper={t("metricCardsHelper")} tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
        <MetricCard
          icon={<CalendarCheck2 />}
          value={demoBookingCount ?? 0}
          label={t("metricDemoRequests")}
          helper={t("metricDemoPending", { count: pendingDemoBookingCount ?? 0 })}
          tone="var(--theme-sky)"
          iconBackground="rgba(47, 119, 184, 0.12)"
        />
      </section>

      <section className="dashboard-grid two admin-overview-graphics">
        <article className="panel dashboard-panel admin-chart-panel">
          <div className="panel-top">
            <div>
              <h2>{t("recognitionActivityTitle")}</h2>
              <p>{t("recognitionActivityCopy")}</p>
            </div>
            <Link className="quality-pill" href={`/${locale}/admin/analytics`}>{tc("analytics")}</Link>
          </div>
          {recognitionCount ? (
            <LineChart
              points={trendPoints}
              labels={monthWindows.map((month) => month.label)}
              color="var(--theme-ink)"
              ariaLabel={t("chartAriaRecognition")}
              showValues
            />
          ) : (
            <EmptyState title={t("emptyNoRecognitionsTitle")} copy={t("emptyNoRecognitionsCopy")} />
          )}
        </article>

        <article className="panel dashboard-panel admin-chart-panel">
          <div className="panel-top">
            <div>
              <h2>{t("userGrowthTitle")}</h2>
              <p>{t("userGrowthCopy")}</p>
            </div>
          </div>
          {profileCount ? (
            <LineChart points={userTrendPoints} labels={monthWindows.map((month) => month.label)} color="var(--theme-gold)" />
          ) : (
            <EmptyState title={t("emptyNoUserGrowthTitle")} copy={t("emptyNoUserGrowthCopy")} />
          )}
        </article>
      </section>

      <article className="panel dashboard-panel">
        <div className="panel-top">
          <div>
            <h2>{t("recentCompaniesTitle")}</h2>
            <p>{t("recentCompaniesCopy")}</p>
          </div>
          <Link href={`/${locale}/admin/companies`} className="panel-link">{tc("viewAll")}</Link>
        </div>
        {companies?.length ? (
          <div className="table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>{t("tableCompany")}</th>
                  <th>{t("tablePlan")}</th>
                  <th>{t("tableStatus")}</th>
                  <th>{t("tableCreated")}</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td><strong>{company.company_name}</strong></td>
                    <td>{company.subscription_plan}</td>
                    <td>{company.status}</td>
                    <td>{new Intl.DateTimeFormat(dateLocale, { month: "short", day: "numeric", year: "numeric" }).format(new Date(company.created_at))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={t("emptyNoCompaniesTitle")} copy={t("emptyNoCompaniesCopy")} />
        )}
      </article>
    </DashboardShell>
  );
}
