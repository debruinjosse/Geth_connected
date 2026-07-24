import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Activity, Gauge, Info, Percent, Star, UserRound, UsersRound } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BarChart } from "@/components/BarChart";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { LineChart } from "@/components/LineChart";
import { QualityBars } from "@/components/QualityBars";
import { companyAdmin, companyCategoryShare, companyTrendThisQuarter, teamComparison } from "@/lib/demo-data";
import { fetchCompanyDashboardInsights, type ComparisonMetric, type ComparisonState } from "@/lib/data/company-dashboard-insights";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CompanyDashboardPageProps = {
  params: Promise<{ locale: string }>;
};

type CompanyProfile = {
  id: string;
  company_id: string | null;
  first_name: string;
  last_name: string;
  role: "employee" | "manager" | "company_admin" | "platform_admin" | "super_admin";
};

type CompanyRow = {
  id: string;
  company_name: string;
};

type Translation = Awaited<ReturnType<typeof getTranslations>>;

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "CA";
}

function getComparisonText(metric: ComparisonMetric, suffix: string) {
  return `${metric.label} ${suffix}`;
}

function getLatestSixMonthLabels() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return new Intl.DateTimeFormat("en", { month: "short" }).format(date);
  });
}

function getStateArrow(state: ComparisonState) {
  if (state === "positive" || state === "new") return "+";
  if (state === "negative") return "-";
  return "=";
}

function RecognitionSparkline({ points, label }: { points: number[]; label: string }) {
  const width = 128;
  const height = 44;
  const padding = 5;
  const max = Math.max(...points, 1);
  const step = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const coordinates = points.map((point, index) => {
    const x = padding + index * step;
    const y = height - padding - (point / max) * (height - padding * 2);
    return [x, y] as const;
  });
  const path = coordinates.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

  return (
    <svg className="company-kpi-sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <path className="company-kpi-sparkline-grid" d={`M${padding} ${height - padding}H${width - padding}`} />
      <path className="company-kpi-sparkline-line" d={path} />
      {coordinates.map(([x, y], index) => (
        <circle key={`${x}-${y}-${index}`} cx={x} cy={y} r="2.6" />
      ))}
    </svg>
  );
}

function CompanyMetricCard({
  icon,
  value,
  label,
  comparison,
  tone = "var(--theme-ink)",
  iconBackground = "rgba(42, 23, 61, 0.06)",
  badge,
  info,
  sparkline
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
  comparison?: { text: string; state: ComparisonState };
  tone?: string;
  iconBackground?: string;
  badge?: string;
  info?: string;
  sparkline?: ReactNode;
}) {
  return (
    <article className="company-kpi-card">
      <div className="company-kpi-topline">
        <span className="company-kpi-icon" style={{ color: tone, background: iconBackground }}>
          {icon}
        </span>
        <span className="company-kpi-actions">
          {badge ? <b>{badge}</b> : null}
          {info ? (
            <span className="company-kpi-info" title={info} aria-label={info}>
              <Info size={13} />
            </span>
          ) : null}
        </span>
      </div>
      <strong style={{ color: tone }}>{value}</strong>
      <p>{label}</p>
      {sparkline ? <div className="company-kpi-chart">{sparkline}</div> : null}
      {comparison ? (
        <small className={`company-kpi-comparison ${comparison.state}`}>
          <span aria-hidden="true">{getStateArrow(comparison.state)}</span>
          {comparison.text}
        </small>
      ) : null}
    </article>
  );
}

function DemoCompanyDashboard({ t }: { t: Translation }) {
  const demoTrendLabels = getLatestSixMonthLabels();
  const demoTopQualities = [
    { label: "Listener", category: "Communication", value: 26 },
    { label: "Honest", category: "Communication", value: 22 },
    { label: "Uniter", category: "Communication", value: 18 },
    { label: "Clear Communicator", category: "Communication", value: 16 },
    { label: "Empathetic", category: "Communication", value: 14 }
  ];

  return (
    <DashboardShell role="company" title="ABC Company" subtitle={t("subtitle")} user={companyAdmin} actions={<span className="quality-pill">{t("thisQuarter")}</span>}>
      <section className="company-metrics-grid" aria-label={t("kpiSection")}>
        <CompanyMetricCard icon={<Star size={18} />} value="458" label={t("totalRecognitions")} tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
        <CompanyMetricCard icon={<UserRound size={18} />} value="142" label={t("totalEmployees")} comparison={{ text: t("employeesDefinition"), state: "neutral" }} />
        <CompanyMetricCard icon={<UsersRound size={18} />} value="18" label={t("totalTeams")} tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
        <CompanyMetricCard icon={<Gauge size={18} />} value="87%" label={t("engagementScore")} comparison={{ text: `+8% ${t("vsLast30Days")}`, state: "positive" }} tone="var(--theme-emerald)" iconBackground="rgba(58, 166, 95, 0.12)" />
        <CompanyMetricCard icon={<Percent size={18} />} value="62%" label={t("recognizedEmployees")} comparison={{ text: `+6% ${t("vsLast30Days")}`, state: "positive" }} badge={t("newBadge")} info={t("recognitionRateInfo")} />
        <CompanyMetricCard icon={<Activity size={18} />} value="+23%" label={t("recognitionTrend")} comparison={{ text: t("vsPrevious30Days"), state: "positive" }} badge={t("newBadge")} sparkline={<RecognitionSparkline points={[8, 11, 10, 15, 18, 24]} label={t("sparklineLabel")} />} />
      </section>

      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>{t("categoryDistribution")}</h2></div>
          <BarChart items={companyCategoryShare.map((segment) => ({ label: segment.label, value: segment.value, valueLabel: `${segment.value}%`, color: segment.color }))} />
        </article>

        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>{t("topQualities")}</h2></div>
          <QualityBars items={demoTopQualities} />
        </article>
      </section>

      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>{t("recognitionActivity")}</h2></div>
          <LineChart
            points={[0, 0, 112, 148, 186, 214]}
            labels={demoTrendLabels}
            color="var(--theme-ink)"
            ariaLabel={t("recognitionActivityChartLabel")}
            showValues
          />
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>{t("teamComparison")}</h2></div>
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

export default async function CompanyDashboardPage({ params }: CompanyDashboardPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "companyDashboard" });

  if (!hasSupabaseServerConfig()) {
    return <DemoCompanyDashboard t={t} />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/login`);
  }

  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, company_id, first_name, last_name, role")
    .eq("id", user.id)
    .maybeSingle<CompanyProfile>();

  if (profileError || !currentProfile || !currentProfile.company_id) {
    redirect("/auth/repair-profile");
  }

  const companyId = currentProfile.company_id;
  const [{ data: company, error: companyError }, insights, unreadNotifications] = await Promise.all([
    supabase.from("companies").select("id, company_name").eq("id", companyId).maybeSingle<CompanyRow>(),
    fetchCompanyDashboardInsights(supabase, companyId),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  if (companyError) {
    throw new Error("Failed to load company dashboard data.");
  }

  const companyRow = company as CompanyRow | null;
  const userLabel =
    insights.totalManagers > 0
      ? `${insights.totalManagers} manager${insights.totalManagers === 1 ? "" : "s"} across ${insights.totalTeams || 0} team${insights.totalTeams === 1 ? "" : "s"}`
      : companyRow?.company_name ?? "Company workspace";

  return (
    <DashboardShell
      role="company"
      title={companyRow?.company_name ?? t("title")}
      subtitle={t("subtitle")}
      user={{
        name: `${currentProfile.first_name} ${currentProfile.last_name}`.trim(),
        initials: getInitials(currentProfile.first_name, currentProfile.last_name),
        team: userLabel
      }}
      actions={<span className="quality-pill">{t("liveData")}</span>}
      unreadNotifications={unreadNotifications}
    >
      <section className="company-metrics-grid" aria-label={t("kpiSection")}>
        <CompanyMetricCard icon={<Star size={18} />} value={insights.totalRecognitions} label={t("totalRecognitions")} tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
        <CompanyMetricCard icon={<UserRound size={18} />} value={insights.totalEmployees} label={t("totalEmployees")} comparison={{ text: t("employeesDefinition"), state: "neutral" }} />
        <CompanyMetricCard icon={<UsersRound size={18} />} value={insights.totalTeams} label={t("totalTeams")} tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
        <CompanyMetricCard
          icon={<Gauge size={18} />}
          value={`${insights.engagementScore}%`}
          label={t("engagementScore")}
          comparison={{ text: getComparisonText(insights.engagementDelta, t("vsLast30Days")), state: insights.engagementDelta.state }}
          tone="var(--theme-emerald)"
          iconBackground="rgba(58, 166, 95, 0.12)"
        />
        <CompanyMetricCard
          icon={<Percent size={18} />}
          value={`${insights.recognitionRate}%`}
          label={t("recognizedEmployees")}
          comparison={{ text: getComparisonText(insights.recognitionRateDelta, t("vsLast30Days")), state: insights.recognitionRateDelta.state }}
          badge={t("newBadge")}
          info={t("recognitionRateInfo")}
        />
        <CompanyMetricCard
          icon={<Activity size={18} />}
          value={insights.recognitionTrendLabel}
          label={t("recognitionTrend")}
          comparison={{ text: t("vsPrevious30Days"), state: insights.recognitionTrendState }}
          badge={t("newBadge")}
          sparkline={<RecognitionSparkline points={insights.recognitionSparkline} label={t("sparklineLabel")} />}
        />
      </section>

      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <div>
              <h2>{t("categoryDistribution")}</h2>
              <p>{t("categoryDistributionCopy")}</p>
            </div>
          </div>
          {insights.totalRecognitions ? (
            <BarChart
              items={insights.categorySegments.map((segment) => ({
                label: segment.label,
                value: segment.roundedShare,
                valueLabel: `${segment.roundedShare}% (${segment.count})`,
                color: segment.color
              }))}
            />
          ) : (
            <EmptyState eyebrow={t("emptyRecognitionsEyebrow")} title={t("emptyCategoryTitle")} copy={t("emptyCategoryCopy")} />
          )}
        </article>

        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>{t("topQualities")}</h2></div>
          {insights.topQualities.length ? (
            <QualityBars items={insights.topQualities} />
          ) : (
            <EmptyState eyebrow={t("emptyQualitiesEyebrow")} title={t("emptyQualitiesTitle")} copy={t("emptyQualitiesCopy")} />
          )}
        </article>
      </section>

      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>{t("recognitionActivity")}</h2></div>
          {insights.trendPoints.some((value) => value > 0) ? (
            <LineChart points={insights.trendPoints} labels={insights.trendLabels} color="var(--theme-ink)" ariaLabel={t("recognitionActivityChartLabel")} showValues />
          ) : (
            <>
              <LineChart points={insights.trendPoints} labels={insights.trendLabels} color="var(--theme-ink)" ariaLabel={t("recognitionActivityChartLabel")} showValues />
              <p className="chart-empty-note">{t("emptyTrendCopy")}</p>
            </>
          )}
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>{t("teamComparison")}</h2></div>
          {insights.teamComparisonRows.length ? (
            <>
              {insights.teamComparisonRows.map((team) => (
                <div className="bar-row" key={team.label}>
                  <span>{team.label}</span>
                  <div className="bar-track"><span style={{ width: `${Math.round((team.value / insights.maxTeamValue) * 100)}%`, background: "var(--theme-ink)" }} /></div>
                  <strong>{team.value}</strong>
                </div>
              ))}
              {!insights.totalRecognitions ? (
                <p style={{ marginTop: 18, color: "var(--theme-muted)", fontSize: 14 }}>
                  {t("teamComparisonWaiting")}
                </p>
              ) : null}
            </>
          ) : (
            <EmptyState eyebrow={t("emptyTeamsEyebrow")} title={t("emptyTeamsTitle")} copy={t("emptyTeamsCopy")} />
          )}
        </article>
      </section>
    </DashboardShell>
  );
}
