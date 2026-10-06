import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { QualityBars } from "@/components/QualityBars";
import { getRecentMonthLabels } from "@/lib/locale-format";
import { localizeDemoQualityBars } from "@/lib/localize-demo-content";
import { managerTrendPoints, managerUser, topQualities } from "@/lib/demo-data";
import { getManagerInsights } from "@/lib/data/manager-insights";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BarsChart } from "@/components/ui/BarsChart";
import { Grid } from "@/components/ui/Grid";
import { MeterList } from "@/components/ui/Meter";
import { Panel } from "@/components/ui/Panel";
import { Pill } from "@/components/ui/Pill";

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
      <DashboardShell role="manager" title={tp("analyticsTitle")} subtitle={tp("analyticsSubtitle")} user={managerUser} actions={<Pill>{tc("demoFallback")}</Pill>}>
        <Grid cols="two">
          <Panel title={tp("activityTitle")}>
            <BarsChart labels={getRecentMonthLabels(3, locale)} series={[{ name: tp("activityTitle"), color: "var(--purple)", values: getRecentMonthLabels(3, locale).map((_, index) => managerTrendPoints[index] ?? 0) }]} />
          </Panel>
          <Panel title={tp("qualitiesMix")}>
            <QualityBars items={localizeDemoQualityBars(topQualities, locale)} valueMode="count" />
          </Panel>
        </Grid>
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
      actions={<Pill>{insights.recognitionCount} recognitions</Pill>}
      unreadNotifications={unreadNotifications}
    >
      <Grid cols="two">
        <Panel title={tp("activityTitle")}>
          {insights.recognitionCount ? (
            <BarsChart labels={insights.trendLabels} series={[{ name: tp("activityTitle"), color: "var(--purple)", values: insights.trendLabels.map((_, index) => insights.trendPoints[index] ?? 0) }]} />
          ) : (
            <EmptyState title={tp("noTrendTitle")} copy={tp("noTrendCopy")} />
          )}
        </Panel>
        <Panel title={tp("qualitiesMix")}>
          {insights.qualityBars.length ? <QualityBars items={insights.qualityBars} valueMode="count" /> : <EmptyState title={tp("noQualitiesTitle")} copy={tp("noQualitiesCopy")} />}
        </Panel>
      </Grid>
      <Panel title={tp("memberComparison")}>
        {insights.memberComparison.length ? (
          <MeterList items={insights.memberComparison.map((member) => ({ label: member.label, value: member.value, color: "var(--purple)" }))} />
        ) : (
          <EmptyState title={tp("noComparisonTitle")} copy={tp("noComparisonCopy")} />
        )}
      </Panel>
    </DashboardShell>
  );
}
