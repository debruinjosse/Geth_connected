import { redirect } from "next/navigation";
import { Activity, Gauge, Percent, Star, UserRound, UsersRound } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DashboardShell } from "@/components/DashboardShell";
import { CompanyOverview } from "@/components/company/CompanyOverview";
import { Pill } from "@/components/ui/Pill";
import { companyAdmin, companyCategoryShare, teamComparison } from "@/lib/demo-data";
import { getLocalizedCardTitle, getLocalizedCategoryDisplayName } from "@/lib/cards";
import { fetchCompanyDashboardInsights, type ComparisonMetric } from "@/lib/data/company-dashboard-insights";
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

function getLatestSixMonthLabels(locale: string) {
  const now = new Date();
  const dateLocale = locale === "nl" ? "nl-NL" : "en-US";
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return new Intl.DateTimeFormat(dateLocale, { month: "short" }).format(date);
  });
}

const KPI_ICON_SIZE = 18;

function DemoCompanyDashboard({ t, locale }: { t: Translation; locale: string }) {
  const demoTrendLabels = getLatestSixMonthLabels(locale);
  const categories = ["Communication", "Competence", "Collegiality", "Creativity"];
  const demoTopQualities = [
    { label: getLocalizedCardTitle("Listener", locale), category: getLocalizedCategoryDisplayName("Communication", locale), value: 32 },
    { label: getLocalizedCardTitle("Honest", locale), category: getLocalizedCategoryDisplayName("Communication", locale), value: 22 },
    { label: getLocalizedCardTitle("Uniter", locale), category: getLocalizedCategoryDisplayName("Communication", locale), value: 18 },
    { label: getLocalizedCardTitle("Clear Communicator", locale), category: getLocalizedCategoryDisplayName("Communication", locale), value: 16 },
    { label: getLocalizedCardTitle("Empathetic", locale), category: getLocalizedCategoryDisplayName("Communication", locale), value: 14 }
  ];

  return (
    <DashboardShell role="company" title={t("demoCompany")} subtitle={t("subtitle")} user={companyAdmin} actions={<Pill>{t("thisQuarter")}</Pill>}>
      <CompanyOverview
        hasRecognitions
        kpis={[
          { key: "recognitions", icon: <Star size={KPI_ICON_SIZE} />, value: "458", label: t("totalRecognitions") },
          { key: "employees", icon: <UserRound size={KPI_ICON_SIZE} />, value: "142", label: t("totalEmployees"), comparison: { text: t("employeesDefinition"), state: "neutral" } },
          { key: "teams", icon: <UsersRound size={KPI_ICON_SIZE} />, value: "18", label: t("totalTeams") },
          {
            key: "engagement",
            icon: <Gauge size={KPI_ICON_SIZE} />,
            value: "87%",
            label: t("engagementScore"),
            comparison: { text: `+8% ${t("vsLast30Days")}`, state: "positive" },
            info: t("engagementScoreInfo", { active: 7, total: 8, percent: 87 })
          },
          {
            key: "rate",
            icon: <Percent size={KPI_ICON_SIZE} />,
            value: "62%",
            label: t("recognizedEmployees"),
            comparison: { text: `+6% ${t("vsLast30Days")}`, state: "positive" },
            badge: t("newBadge"),
            info: t("recognitionRateInfo", { recognized: 5, total: 8, percent: 62 })
          },
          { key: "trend", icon: <Activity size={KPI_ICON_SIZE} />, value: "+23%", label: t("recognitionTrend"), comparison: { text: t("vsPrevious30Days"), state: "positive" }, badge: t("newBadge"), sparkline: [8, 11, 10, 15, 18, 24] }
        ]}
        categories={companyCategoryShare.map((segment, index) => ({
          label: getLocalizedCategoryDisplayName(categories[index] ?? segment.label, locale),
          value: segment.value,
          valueLabel: `${segment.value}%`
        }))}
        qualities={demoTopQualities}
        trend={{ points: [0, 0, 112, 148, 186, 214], labels: demoTrendLabels }}
        teams={teamComparison.map((team) => ({ label: team.label, value: team.value }))}
      />
    </DashboardShell>
  );
}

export default async function CompanyDashboardPage({ params }: CompanyDashboardPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "companyDashboard" });

  if (!hasSupabaseServerConfig()) {
    return <DemoCompanyDashboard t={t} locale={locale} />;
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
    fetchCompanyDashboardInsights(supabase, companyId, t("errLoad"), locale),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  if (companyError) {
    throw new Error(t("errLoad"));
  }

  const companyRow = company as CompanyRow | null;
  const userLabel =
    insights.totalManagers > 0
      ? t("managerScope", { managers: insights.totalManagers, teams: insights.totalTeams || 0 })
      : companyRow?.company_name ?? t("companyWorkspace");

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
      actions={<Pill tone="green">{t("liveData")}</Pill>}
      unreadNotifications={unreadNotifications}
    >
      <CompanyOverview
        hasRecognitions={insights.totalRecognitions > 0}
        kpis={[
          { key: "recognitions", icon: <Star size={KPI_ICON_SIZE} />, value: insights.totalRecognitions, label: t("totalRecognitions") },
          { key: "employees", icon: <UserRound size={KPI_ICON_SIZE} />, value: insights.totalEmployees, label: t("totalEmployees"), comparison: { text: t("employeesDefinition"), state: "neutral" } },
          { key: "teams", icon: <UsersRound size={KPI_ICON_SIZE} />, value: insights.totalTeams, label: t("totalTeams") },
          {
            key: "engagement",
            icon: <Gauge size={KPI_ICON_SIZE} />,
            value: `${insights.engagementScore}%`,
            label: t("engagementScore"),
            comparison: { text: getComparisonText(insights.engagementDelta, t("vsLast30Days")), state: insights.engagementDelta.state },
            info: t("engagementScoreInfo", { active: insights.engagementActiveCount, total: insights.totalEmployees, percent: insights.engagementScore })
          },
          {
            key: "rate",
            icon: <Percent size={KPI_ICON_SIZE} />,
            value: `${insights.recognitionRate}%`,
            label: t("recognizedEmployees"),
            comparison: { text: getComparisonText(insights.recognitionRateDelta, t("vsLast30Days")), state: insights.recognitionRateDelta.state },
            badge: insights.recognitionRateDelta.state === "new" ? t("newBadge") : undefined,
            info: t("recognitionRateInfo", { recognized: insights.recognitionReceiverCount, total: insights.totalEmployees, percent: insights.recognitionRate })
          },
          {
            key: "trend",
            icon: <Activity size={KPI_ICON_SIZE} />,
            value: insights.recognitionTrendLabel,
            label: t("recognitionTrend"),
            comparison: { text: t("vsPrevious30Days"), state: insights.recognitionTrendState },
            badge: t("newBadge"),
            sparkline: insights.recognitionSparkline
          }
        ]}
        categories={insights.categorySegments.map((segment) => ({ label: segment.label, value: segment.roundedShare, valueLabel: `${segment.roundedShare}% (${segment.count})` }))}
        qualities={insights.topQualities}
        trend={{ points: insights.trendPoints, labels: insights.trendLabels }}
        teams={insights.teamComparisonRows.map((team) => ({ label: team.label, value: Math.round((team.value / insights.maxTeamValue) * 100) }))}
        teamsWaiting={!insights.totalRecognitions}
      />
    </DashboardShell>
  );
}
