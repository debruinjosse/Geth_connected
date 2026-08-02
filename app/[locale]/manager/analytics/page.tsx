import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { BarChart } from "@/components/BarChart";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { QualityBars } from "@/components/QualityBars";
import { getRecentMonthLabels } from "@/lib/locale-format";
import { localizeDemoQualityBars } from "@/lib/localize-demo-content";
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
  const locale = await getLocale();
  const tp = await getTranslations({ locale, namespace: "managerPages" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const tm = await getTranslations({ locale, namespace: "manager" });

  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell role="manager" title={tp("analyticsTitle")} subtitle={tp("analyticsSubtitle")} user={managerUser} actions={<span className="quality-pill">{tc("demoFallback")}</span>}>
        <section className="dashboard-grid two">
          <article className="panel dashboard-panel">
            <div className="panel-top"><h2>{tp("activityTitle")}</h2></div>
            <BarChart items={getRecentMonthLabels(3, locale).map((label, index) => ({ label, value: managerTrendPoints[index] ?? 0, color: "var(--theme-emerald)" }))} />
          </article>
          <article className="panel dashboard-panel">
            <div className="panel-top"><h2>{tp("qualitiesMix")}</h2></div>
            <QualityBars items={localizeDemoQualityBars(topQualities, locale)} valueMode="count" />
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
  if (userError || !user) redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/manager/analytics`)}`);

  let insights;
  try {
    insights = await getManagerInsights(supabase, user.id, tm, locale);
  } catch (error) {
    if (error instanceof Error && error.message === "missing_profile") redirect(`/auth/repair-profile?next=${encodeURIComponent(`/${locale}/manager/analytics`)}`);
    throw error;
  }

  const unreadNotifications = await getUnreadNotificationCount(supabase, user.id);

  return (
    <DashboardShell
      role="manager"
      title={tp("analyticsTitle")}
      subtitle={tp("analyticsSubtitle")}
      user={{
        name: `${insights.profile.first_name ?? ""} ${insights.profile.last_name ?? ""}`.trim() || tc("managerRole"),
        initials: getInitials(insights.profile.first_name, insights.profile.last_name),
        team: insights.teamLabel,
        imageUrl: insights.profile.profile_image
      }}
      actions={<span className="quality-pill">{insights.recognitionCount} recognitions</span>}
      unreadNotifications={unreadNotifications}
    >
      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>{tp("activityTitle")}</h2></div>
          {insights.recognitionCount ? (
            <BarChart items={insights.trendLabels.map((label, index) => ({ label, value: insights.trendPoints[index] ?? 0, color: "var(--theme-emerald)" }))} />
          ) : (
            <EmptyState title={tp("noTrendTitle")} copy={tp("noTrendCopy")} />
          )}
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>{tp("qualitiesMix")}</h2></div>
          {insights.qualityBars.length ? <QualityBars items={insights.qualityBars} valueMode="count" /> : <EmptyState title={tp("noQualitiesTitle")} copy={tp("noQualitiesCopy")} />}
        </article>
      </section>
      <article className="panel dashboard-panel">
        <div className="panel-top"><h2>{tp("memberComparison")}</h2></div>
        {insights.memberComparison.length ? (
          insights.memberComparison.map((member) => (
            <div className="bar-row" key={member.label}>
              <span>{member.label}</span>
              <div className="bar-track"><span style={{ width: `${Math.max(8, member.value * 18)}%`, background: "var(--theme-ink)" }} /></div>
              <strong>{member.value}</strong>
            </div>
          ))
        ) : (
          <EmptyState title={tp("noComparisonTitle")} copy={tp("noComparisonCopy")} />
        )}
      </article>
    </DashboardShell>
  );
}
