import { redirect } from "next/navigation";
import { Star, TrendingUp, UserRound, UsersRound } from "lucide-react";
import { BarChart } from "@/components/BarChart";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { QualityBars, type QualityBarItem } from "@/components/QualityBars";
import { categoryMeta, getCanonicalCardBySlugOrNumber, type CardCategory } from "@/lib/cards";
import {
  companyAdmin,
  companyCategoryShare,
  companyTrendLastQuarter,
  companyTrendThisQuarter,
  teamComparison,
  topQualities
} from "@/lib/demo-data";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CompanyProfile = {
  id: string;
  company_id: string | null;
  first_name: string;
  last_name: string;
  role: "employee" | "manager" | "company_admin" | "platform_admin" | "super_admin";
  team_id: string | null;
};

type CompanyRow = {
  id: string;
  company_name: string;
};

type TeamRow = {
  id: string;
  name: string;
  manager_id: string | null;
};

type RecognitionRow = {
  id: string;
  team_id: string | null;
  receiver_user_id: string;
  created_at: string;
  card: { title: string; category: string; card_number?: number | null; qr_slug?: string | null } | Array<{ title: string; category: string; card_number?: number | null; qr_slug?: string | null }> | null;
};

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "CA";
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthWindows(size: number) {
  const current = new Date();
  const recent = Array.from({ length: size }, (_, index) => {
    const date = new Date(current.getFullYear(), current.getMonth() - (size - 1 - index), 1);
    return {
      key: getMonthKey(date),
      label: new Intl.DateTimeFormat("en", { month: "short" }).format(date)
    };
  });

  const previous = Array.from({ length: size }, (_, index) => {
    const date = new Date(current.getFullYear(), current.getMonth() - (size * 2 - 1 - index), 1);
    return {
      key: getMonthKey(date),
      label: new Intl.DateTimeFormat("en", { month: "short" }).format(date)
    };
  });

  return { recent, previous };
}

const fourCCategories: CardCategory[] = ["Communicatie", "Creativiteit", "Competentie", "Collegialiteit"];

function DemoCompanyDashboard() {
  return (
    <DashboardShell role="company" title="ABC Company" subtitle="Your culture at a glance." user={companyAdmin} actions={<span className="quality-pill">This quarter</span>}>
      <section className="metrics-grid">
        <MetricCard icon={<Star />} value="458" label="Total recognitions" tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
        <MetricCard icon={<UserRound />} value="142" label="Total employees" />
        <MetricCard icon={<UsersRound />} value="18" label="Total teams" tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
        <MetricCard icon={<TrendingUp />} value="87%" label="Engagement score" tone="var(--theme-emerald)" iconBackground="rgba(58, 166, 95, 0.12)" />
      </section>

      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>Four C category distribution</h2></div>
          <BarChart items={companyCategoryShare.map((segment) => ({ label: segment.label, value: segment.value, valueLabel: `${segment.value}%`, color: segment.color }))} />
        </article>

        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>Top qualities company-wide</h2></div>
          <QualityBars items={topQualities.map((quality) => ({ ...quality, value: quality.value * 3 }))} valueSuffix="" />
        </article>
      </section>

      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>Recognition activity</h2></div>
          <BarChart items={["Apr", "May", "Jun"].map((label, index) => ({ label: `${label} - this quarter`, value: companyTrendThisQuarter[index] ?? 0, color: "var(--theme-ink)" }))} />
          <div style={{ marginTop: 18 }}>
            <BarChart compact items={["Apr", "May", "Jun"].map((label, index) => ({ label: `${label} - last quarter`, value: companyTrendLastQuarter[index] ?? 0, color: "var(--theme-gold)" }))} />
          </div>
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>Team comparison</h2></div>
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

export default async function CompanyDashboardPage() {
  if (!hasSupabaseServerConfig()) {
    return <DemoCompanyDashboard />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, company_id, first_name, last_name, role")
    .eq("id", user.id)
    .maybeSingle<Pick<CompanyProfile, "id" | "company_id" | "first_name" | "last_name" | "role">>();

  if (profileError || !currentProfile || !currentProfile.company_id) {
    redirect("/auth/repair-profile");
  }

  const companyId = currentProfile.company_id;

  const [{ data: company, error: companyError }, { data: profiles, error: profilesError }, { data: teams, error: teamsError }, { data: recognitions, error: recognitionsError }] =
    await Promise.all([
      supabase.from("companies").select("id, company_name").eq("id", companyId).maybeSingle<CompanyRow>(),
      supabase.from("profiles").select("id, company_id, first_name, last_name, role, team_id").eq("company_id", companyId),
      supabase.from("teams").select("id, name, manager_id").eq("company_id", companyId).order("name"),
      supabase
        .from("recognition_events")
        .select("id, team_id, receiver_user_id, created_at, card:card_library(title, category, card_number, qr_slug)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
    ]);

  if (companyError || profilesError || teamsError || recognitionsError) {
    throw new Error("Failed to load company dashboard data.");
  }

  const companyRow = company as CompanyRow | null;
  const companyProfiles = (profiles ?? []) as CompanyProfile[];
  const companyTeams = (teams ?? []) as TeamRow[];
  const companyRecognitions = (recognitions ?? []) as RecognitionRow[];

  const employees = companyProfiles.filter((profile) => profile.role === "employee");
  const managers = companyProfiles.filter((profile) => profile.role === "manager");
  const activeReceiverIds = new Set(companyRecognitions.map((recognition) => recognition.receiver_user_id));
  const engagementScore = employees.length ? Math.round((employees.filter((employee) => activeReceiverIds.has(employee.id)).length / employees.length) * 100) : 0;

  const qualityCounts = new Map<string, { count: number; category: string }>();
  const categoryCounts = new Map<string, number>();
  const teamCounts = new Map<string, number>();
  const monthlyCounts = new Map<string, number>();

  for (const recognition of companyRecognitions) {
    const card = Array.isArray(recognition.card) ? recognition.card[0] : recognition.card;
    if (card) {
      const canonicalCard = getCanonicalCardBySlugOrNumber(card.card_number, card.qr_slug);
      const title = canonicalCard?.title ?? card.title;
      const category = canonicalCard?.category ?? card.category;
      const existingQuality = qualityCounts.get(title);
      qualityCounts.set(title, {
        count: (existingQuality?.count ?? 0) + 1,
        category
      });
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }

    if (recognition.team_id) {
      teamCounts.set(recognition.team_id, (teamCounts.get(recognition.team_id) ?? 0) + 1);
    }

    const monthKey = getMonthKey(new Date(recognition.created_at));
    monthlyCounts.set(monthKey, (monthlyCounts.get(monthKey) ?? 0) + 1);
  }

  const categorySegments = fourCCategories.map((category) => {
    const meta = categoryMeta[category];
    const count = categoryCounts.get(category) ?? 0;
    const share = companyRecognitions.length ? (count / companyRecognitions.length) * 100 : 0;
    const roundedShare = companyRecognitions.length ? Math.round(share) : 0;
    return {
      label: meta.label,
      category,
      color: meta.color,
      count,
      share,
      roundedShare
    };
  });

  const topQualityBars: QualityBarItem[] = Array.from(qualityCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([label, info]) => ({
      label,
      category: info.category,
      value: companyRecognitions.length ? Math.max(1, Math.round((info.count / companyRecognitions.length) * 100)) : 0
    }));

  const teamComparisonRows = companyTeams
    .map((team) => ({
      label: team.name,
      value: teamCounts.get(team.id) ?? 0
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const maxTeamValue = Math.max(...teamComparisonRows.map((team) => team.value), 1);
  const { recent, previous } = getMonthWindows(6);
  const trendPoints = recent.map((month) => monthlyCounts.get(month.key) ?? 0);
  const trendLabels = recent.map((month) => month.label);
  const comparisonPoints = previous.map((month) => monthlyCounts.get(month.key) ?? 0);
  const comparisonLabels = previous.map((month) => month.label);

  const totalEmployees = employees.length;
  const totalTeams = companyTeams.length;
  const totalManagers = managers.length;
  const unreadNotifications = await getUnreadNotificationCount(supabase, user.id);
  const userLabel =
    totalManagers > 0
      ? `${totalManagers} manager${totalManagers === 1 ? "" : "s"} across ${totalTeams || 0} team${totalTeams === 1 ? "" : "s"}`
      : companyRow?.company_name ?? "Company workspace";

  return (
    <DashboardShell
      role="company"
      title={companyRow?.company_name ?? "Company dashboard"}
      subtitle="Your culture at a glance."
      user={{
        name: `${currentProfile.first_name} ${currentProfile.last_name}`.trim(),
        initials: getInitials(currentProfile.first_name, currentProfile.last_name),
        team: userLabel
      }}
      actions={<span className="quality-pill">Live data</span>}
      unreadNotifications={unreadNotifications}
    >
      <section className="metrics-grid">
        <MetricCard icon={<Star />} value={companyRecognitions.length} label="Total recognitions" tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
        <MetricCard icon={<UserRound />} value={totalEmployees} label="Total employees" />
        <MetricCard icon={<UsersRound />} value={totalTeams} label="Total teams" tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
        <MetricCard icon={<TrendingUp />} value={`${engagementScore}%`} label="Engagement score" tone="var(--theme-emerald)" iconBackground="rgba(58, 166, 95, 0.12)" />
      </section>

      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <div>
              <h2>Four C category distribution</h2>
              <p>Communication, Creativity, Competence, and Collegiality are shown clearly for company-wide recognition.</p>
            </div>
          </div>
          {companyRecognitions.length ? (
            <BarChart
              items={categorySegments.map((segment) => ({
                label: segment.label,
                value: segment.roundedShare,
                valueLabel: `${segment.roundedShare}% (${segment.count})`,
                color: segment.color
              }))}
            />
          ) : (
            <EmptyState
              eyebrow="No recognitions yet"
              title="Category insights will appear here"
              copy="Once employees start claiming cards, this panel will show which strengths are showing up most across the company."
            />
          )}
        </article>

        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>Top qualities company-wide</h2></div>
          {topQualityBars.length ? (
            <QualityBars items={topQualityBars} />
          ) : (
            <EmptyState
              eyebrow="No qualities yet"
              title="Top strengths need recognition activity"
              copy="As recognitions come in, the qualities most celebrated across your company will surface here automatically."
            />
          )}
        </article>
      </section>

      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>Recognition activity</h2></div>
          {companyRecognitions.length ? (
            <>
              <BarChart items={trendLabels.map((label, index) => ({ label, value: trendPoints[index] ?? 0, color: "var(--theme-ink)" }))} />
              <div style={{ marginTop: 14 }}>
                <BarChart compact items={comparisonLabels.map((label, index) => ({ label: `${label} previous`, value: comparisonPoints[index] ?? 0, color: "var(--theme-gold)" }))} />
              </div>
            </>
          ) : (
            <EmptyState
              eyebrow="Trend unavailable"
              title="Recognition activity needs company activity"
              copy="Monthly momentum will appear here after recognitions begin flowing through your company."
            />
          )}
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top"><h2>Team comparison</h2></div>
          {teamComparisonRows.length ? (
            <>
              {teamComparisonRows.map((team) => (
                <div className="bar-row" key={team.label}>
                  <span>{team.label}</span>
                  <div className="bar-track"><span style={{ width: `${Math.round((team.value / maxTeamValue) * 100)}%`, background: "var(--theme-ink)" }} /></div>
                  <strong>{team.value}</strong>
                </div>
              ))}
              {!companyRecognitions.length ? (
                <p style={{ marginTop: 18, color: "var(--theme-muted)", fontSize: 14 }}>
                  Teams are loaded. Recognition totals will fill in as activity is claimed.
                </p>
              ) : null}
            </>
          ) : (
            <EmptyState
              eyebrow="No teams yet"
              title="Create teams to compare momentum"
              copy="Once your company has teams assigned, this panel will compare recognition activity across them."
            />
          )}
        </article>
      </section>
    </DashboardShell>
  );
}
