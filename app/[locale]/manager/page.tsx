import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Activity, Heart, UserRound, UsersRound } from "lucide-react";
import { BarChart } from "@/components/BarChart";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { QualityBars, type QualityBarItem } from "@/components/QualityBars";
import { SignalList } from "@/components/SignalList";
import { TeamTable, type TeamMemberRow } from "@/components/TeamTable";
import { categoryMeta } from "@/lib/cards";
import { managerTrendPoints, managerUser, people, teamSignals, topQualities } from "@/lib/demo-data";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "MG";
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getQuarterKey(date: Date) {
  return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_ACTIVITY_MS = 30 * DAY_MS;
const INACTIVITY_SIGNAL_MS = 14 * DAY_MS;

function getTrendForDates(dates: string[]) {
  const now = new Date();
  const currentMonth = getMonthKey(now);
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonth = getMonthKey(previousMonthDate);

  let current = 0;
  let previous = 0;

  for (const value of dates) {
    const key = getMonthKey(new Date(value));
    if (key === currentMonth) current += 1;
    if (key === previousMonth) previous += 1;
  }

  return current - previous;
}

function getEnergyBucket(totalReceived: number, recentReceived: number): TeamMemberRow["energy"] {
  if (recentReceived >= 2) return "HOOG";
  if (recentReceived >= 1 || totalReceived >= 1) return "GEMIDDELD";
  return "LAAG";
}

function getLatestActivityTime(rows: Array<{ created_at: string }>) {
  return rows.reduce((latest, row) => Math.max(latest, new Date(row.created_at).getTime()), 0);
}

function getWeeksSince(timestamp: number) {
  return Math.max(1, Math.floor((Date.now() - timestamp) / (7 * DAY_MS)));
}

function getPercentageMix<T extends { value: number }>(items: T[]) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (!total) return items.map(() => 0);

  const rounded = items.map((item) => Math.round((item.value / total) * 100));
  const drift = 100 - rounded.reduce((sum, value) => sum + value, 0);
  if (rounded.length) rounded[0] += drift;
  return rounded;
}

function toPercentageQualityBars(items: QualityBarItem[]): QualityBarItem[] {
  const percentages = getPercentageMix(items.map((item) => ({ value: item.value })));
  return items.map((item, index) => ({ ...item, value: percentages[index] ?? 0 }));
}

export default async function ManagerDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "manager" });
  const signalsHref = `/${locale}/manager/signals`;

  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell
        role="manager"
        title={t("overviewTitle")}
        subtitle={t("overviewSubtitle")}
        user={managerUser}
        actions={<span className="quality-pill">{t("thisQuarter")}</span>}
      >
        <section className="metrics-grid">
          <MetricCard icon={<Heart />} value="124" label={t("totalRecognitions")} />
          <MetricCard icon={<UsersRound />} value="92%" label={t("teamEngagement")} tone="var(--theme-emerald)" iconBackground="rgba(58, 166, 95, 0.12)" />
          <MetricCard icon={<UserRound />} value="8" label={t("activeMembers")} tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
          <MetricCard icon={<Activity />} value="4" label={t("signals")} />
        </section>

        <section className="dashboard-grid two">
          <article className="panel dashboard-panel">
            <div className="panel-top">
              <h2>{t("teamTable")}</h2>
            </div>
            <TeamTable people={people} />
          </article>
          <aside className="panel dashboard-panel">
            <div className="panel-top">
              <h2>{t("teamSignals")}</h2>
              <a href={signalsHref} style={{ color: "var(--theme-ink)", fontWeight: 700 }}>
                View all
              </a>
            </div>
            <SignalList items={teamSignals} />
          </aside>
        </section>

        <section className="dashboard-grid three">
          <article className="panel dashboard-panel">
            <div className="panel-top">
              <h2>{t("activityTitle")}</h2>
              <span className="quality-pill">{t("thisQuarter")}</span>
            </div>
            <BarChart items={["Jul", "Aug", "Sep"].map((label, index) => ({ label, value: managerTrendPoints[index] ?? 0, color: "var(--theme-ink)" }))} />
          </article>
          <article className="panel dashboard-panel">
            <div className="panel-top">
              <h2>{t("topQualitiesTitle")}</h2>
            </div>
            <QualityBars items={toPercentageQualityBars(topQualities)} />
          </article>
          <article className="panel dashboard-panel">
            <div className="panel-top">
              <h2>{t("impactTitle")}</h2>
              <span className="quality-pill">{t("thisQuarter")}</span>
            </div>
            <BarChart
              compact
              items={[
                { label: "Last quarter", value: 18, color: "rgba(42, 23, 61, 0.32)" },
                { label: "This quarter", value: 23, color: "var(--theme-emerald)" },
                { label: "Impact change", value: 23, valueLabel: "+23%", color: "var(--theme-gold)", helper: "Increase in team recognition compared to last quarter." }
              ]}
            />
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

  if (userError || !user) {
    return (
      <DashboardShell
        role="manager"
        title={t("overviewTitle")}
        subtitle={t("overviewSubtitle")}
        user={managerUser}
        actions={<span className="quality-pill">{t("thisQuarter")}</span>}
      >
        <section className="metrics-grid">
          <MetricCard icon={<Heart />} value="124" label={t("totalRecognitions")} />
          <MetricCard icon={<UsersRound />} value="92%" label={t("teamEngagement")} tone="var(--theme-emerald)" iconBackground="rgba(58, 166, 95, 0.12)" />
          <MetricCard icon={<UserRound />} value="8" label={t("activeMembers")} tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
          <MetricCard icon={<Activity />} value="4" label={t("signals")} />
        </section>

        <section className="dashboard-grid two">
          <article className="panel dashboard-panel">
            <div className="panel-top">
              <h2>{t("teamTable")}</h2>
            </div>
            <TeamTable people={people} />
          </article>
          <aside className="panel dashboard-panel">
            <div className="panel-top">
              <h2>{t("teamSignals")}</h2>
              <a href={signalsHref} style={{ color: "var(--theme-ink)", fontWeight: 700 }}>
                View all
              </a>
            </div>
            <SignalList items={teamSignals} />
          </aside>
        </section>

        <section className="dashboard-grid three">
          <article className="panel dashboard-panel">
            <div className="panel-top">
              <h2>{t("activityTitle")}</h2>
              <span className="quality-pill">{t("thisQuarter")}</span>
            </div>
            <BarChart items={["Jul", "Aug", "Sep"].map((label, index) => ({ label, value: managerTrendPoints[index] ?? 0, color: "var(--theme-ink)" }))} />
          </article>
          <article className="panel dashboard-panel">
            <div className="panel-top">
              <h2>{t("topQualitiesTitle")}</h2>
            </div>
            <QualityBars items={toPercentageQualityBars(topQualities)} />
          </article>
          <article className="panel dashboard-panel">
            <div className="panel-top">
              <h2>{t("impactTitle")}</h2>
              <span className="quality-pill">{t("thisQuarter")}</span>
            </div>
            <BarChart
              compact
              items={[
                { label: "Last quarter", value: 18, color: "rgba(42, 23, 61, 0.32)" },
                { label: "This quarter", value: 23, color: "var(--theme-emerald)" },
                { label: "Impact change", value: 23, valueLabel: "+23%", color: "var(--theme-gold)", helper: "Increase in team recognition compared to last quarter." }
              ]}
            />
          </article>
        </section>
      </DashboardShell>
    );
  }

  const { data: managerProfile, error: managerProfileError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, team_id")
    .eq("id", user.id)
    .maybeSingle<{ id: string; first_name: string; last_name: string; team_id: string | null }>();

  if (managerProfileError || !managerProfile) {
    redirect("/auth/repair-profile");
  }

  const { data: managedTeams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name")
    .eq("manager_id", user.id);

  if (teamsError) {
    throw new Error(t("errLoadTeams"));
  }

  const teams = managedTeams ?? [];
  const teamIds = teams.map((team) => team.id);
  const teamNameMap = new Map(teams.map((team) => [team.id, team.name]));
  const teamLabel =
    teams.length === 1 ? teams[0]?.name ?? t("assignedTeam") : teams.length > 1 ? t("managedTeams", { count: teams.length }) : t("noTeam");
  const unreadNotifications = await getUnreadNotificationCount(supabase, user.id);

  if (!teamIds.length) {
    return (
      <DashboardShell
        role="manager"
        title={t("overviewTitle")}
        subtitle={t("overviewSubtitle")}
        user={{
          name: `${managerProfile.first_name} ${managerProfile.last_name}`.trim(),
          initials: getInitials(managerProfile.first_name, managerProfile.last_name),
          team: teamLabel
        }}
        actions={<span className="quality-pill">{t("liveData")}</span>}
        unreadNotifications={unreadNotifications}
      >
        <section className="metrics-grid">
          <MetricCard icon={<Heart />} value="0" label={t("totalRecognitions")} />
          <MetricCard icon={<UsersRound />} value="0%" label={t("teamEngagement")} tone="var(--theme-emerald)" iconBackground="rgba(58, 166, 95, 0.12)" />
          <MetricCard icon={<UserRound />} value="0" label={t("activeMembers")} tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
          <MetricCard icon={<Activity />} value="0" label={t("signals")} />
        </section>

        <section className="dashboard-grid two">
          <article className="panel dashboard-panel">
            <EmptyState
              eyebrow={t("emptyNoTeamEyebrow")}
              title={t("emptyNoTeamTitle")}
              copy={t("emptyNoTeamCopy")}
            />
          </article>
          <aside className="panel dashboard-panel">
            <EmptyState
              eyebrow={t("emptySignalsPendingEyebrow")}
              title={t("emptySignalsPendingTitle")}
              copy={t("emptySignalsPendingCopy")}
            />
          </aside>
        </section>

        <section className="dashboard-grid three">
          <article className="panel dashboard-panel">
            <EmptyState eyebrow={t("emptyActivityEyebrow")} title={t("emptyActivityTitle")} copy={t("emptyActivityCopy")} />
          </article>
          <article className="panel dashboard-panel">
            <EmptyState eyebrow={t("emptyQualitiesEyebrow")} title={t("emptyQualitiesTitle")} copy={t("emptyQualitiesCopy")} />
          </article>
          <article className="panel dashboard-panel">
            <EmptyState eyebrow={t("emptyImpactEyebrow")} title={t("emptyImpactTitle")} copy={t("emptyImpactCopy")} />
          </article>
        </section>
      </DashboardShell>
    );
  }

  const [{ data: members, error: membersError }, { data: teamRecognitions, error: recognitionsError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, team_id")
      .in("team_id", teamIds)
      .in("role", ["employee", "manager"]),
    supabase
      .from("recognition_events")
      .select("id, receiver_user_id, giver_user_id, created_at, card:card_library(title, category, card_number, qr_slug)")
      .in("team_id", teamIds)
      .order("created_at", { ascending: false })
  ]);

  if (membersError || recognitionsError) {
    throw new Error(t("errLoadTeamData"));
  }

  const memberRows = (members ?? []) as Array<{ id: string; first_name: string; last_name: string; team_id: string | null }>;

  if (!memberRows.some((member) => member.id === managerProfile.id)) {
    memberRows.push({
      id: managerProfile.id,
      first_name: managerProfile.first_name,
      last_name: managerProfile.last_name,
      team_id: managerProfile.team_id
    });
  }

  const recognitions = (teamRecognitions ?? []) as Array<{
    id: string;
    receiver_user_id: string;
    giver_user_id: string | null;
    created_at: string;
    card: { title: string; category: string; card_number?: number | null; qr_slug?: string | null } | Array<{ title: string; category: string; card_number?: number | null; qr_slug?: string | null }> | null;
  }>;

  const memberIds = memberRows.map((member) => member.id);
  const memberNameMap = new Map(memberRows.map((member) => [member.id, `${member.first_name} ${member.last_name}`.trim()]));

  const recognitionsByReceiver = new Map<string, typeof recognitions>();
  const recognitionsByGiver = new Map<string, typeof recognitions>();
  const qualityCounts = new Map<string, { value: number; category: string }>();
  const monthlyCounts = new Map<string, number>();

  for (const recognition of recognitions) {
    const card = Array.isArray(recognition.card) ? recognition.card[0] : recognition.card;
    if (card) {
      const title = card.title;
      const category = card.category;
      const existingQuality = qualityCounts.get(title);
      qualityCounts.set(title, {
        value: (existingQuality?.value ?? 0) + 1,
        category
      });
    }

    if (!recognitionsByReceiver.has(recognition.receiver_user_id)) {
      recognitionsByReceiver.set(recognition.receiver_user_id, []);
    }
    recognitionsByReceiver.get(recognition.receiver_user_id)!.push(recognition);

    if (recognition.giver_user_id && memberIds.includes(recognition.giver_user_id)) {
      if (!recognitionsByGiver.has(recognition.giver_user_id)) {
        recognitionsByGiver.set(recognition.giver_user_id, []);
      }
      recognitionsByGiver.get(recognition.giver_user_id)!.push(recognition);
    }

    const monthKey = getMonthKey(new Date(recognition.created_at));
    monthlyCounts.set(monthKey, (monthlyCounts.get(monthKey) ?? 0) + 1);
  }

  const teamTableRows: TeamMemberRow[] = memberRows.map((member) => {
    const receivedForMember = recognitionsByReceiver.get(member.id) ?? [];
    const givenForMember = recognitionsByGiver.get(member.id) ?? [];
    const trend = getTrendForDates(receivedForMember.map((recognition) => recognition.created_at));
    const recent30DayReceived = receivedForMember.filter((recognition) => Date.now() - new Date(recognition.created_at).getTime() <= RECENT_ACTIVITY_MS).length;

    const topQualityCounter = new Map<string, number>();
    for (const recognition of receivedForMember) {
      const card = Array.isArray(recognition.card) ? recognition.card[0] : recognition.card;
      if (card) {
        const title = card.title;
        topQualityCounter.set(title, (topQualityCounter.get(title) ?? 0) + 1);
      }
    }
    const topQuality =
      Array.from(topQualityCounter.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      t("noRecognitionsYet");

    return {
      id: member.id,
      name: `${member.first_name} ${member.last_name}`.trim(),
      team: teamNameMap.get(member.team_id ?? "") ?? t("assignedTeam"),
      cardsReceived: receivedForMember.length,
      cardsGiven: givenForMember.length,
      trend,
      energy: getEnergyBucket(receivedForMember.length, recent30DayReceived),
      topQuality
    };
  });

  const signalItems = teamTableRows.flatMap((member) => {
    const receivedForMember = recognitionsByReceiver.get(member.id) ?? [];
    const givenForMember = recognitionsByGiver.get(member.id) ?? [];
    const latestActivityAt = getLatestActivityTime([...receivedForMember, ...givenForMember]);

    if (!latestActivityAt) {
      return [{
        id: `signal-${member.id}`,
        tone: "var(--theme-red)",
        title: t("signalNoActivityTitle", { name: member.name }),
        detail: t("signalNoActivityDetail"),
        actionLabel: t("signalSendNote"),
        actionHref: "/manager/team"
      }];
    }

    if (Date.now() - latestActivityAt >= INACTIVITY_SIGNAL_MS) {
      return [{
        id: `signal-inactive-${member.id}`,
        tone: "var(--theme-red)",
        title: t("signalInactiveTitle", { name: member.name, weeks: getWeeksSince(latestActivityAt) }),
        detail: t("signalInactiveDetail"),
        actionLabel: t("signalSendNote"),
        actionHref: "/manager/team"
      }];
    }

    if (member.energy === "LAAG") {
      return [{
        id: `signal-low-${member.id}`,
        tone: "var(--theme-gold)",
        title: t("signalLowTitle", { name: member.name }),
        detail: t("signalLowDetail")
      }];
    }

    return [];
  }).slice(0, 4);

  if (!signalItems.length && teamTableRows.length) {
    signalItems.push({
      id: "signal-positive",
      tone: "var(--theme-emerald)",
      title: t("signalGreatTitle"),
      detail: t("signalGreatDetail")
    });
  }

  const topQualityEntries = Array.from(qualityCounts.entries()).sort((a, b) => b[1].value - a[1].value).slice(0, 5);
  const topQualityPercentages = getPercentageMix(topQualityEntries.map(([, info]) => ({ value: info.value })));
  const topQualityBars: QualityBarItem[] = topQualityEntries.map(([label, info], index) => ({
      label,
      value: topQualityPercentages[index] ?? 0,
      category: info.category
    }));

  const growthMonths = Array.from({ length: 3 }, (_, index) => {
    const date = new Date(new Date().getFullYear(), new Date().getMonth() - (2 - index), 1);
    return {
      key: getMonthKey(date),
      label: new Intl.DateTimeFormat(locale, { month: "short" }).format(date)
    };
  });
  const trendPoints = growthMonths.map((month) => monthlyCounts.get(month.key) ?? 0);
  const trendLabels = growthMonths.map((month) => month.label);

  const currentQuarterKey = getQuarterKey(new Date());
  const previousQuarterDate = new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1);
  const previousQuarterKey = getQuarterKey(previousQuarterDate);
  let currentQuarterCount = 0;
  let previousQuarterCount = 0;
  for (const recognition of recognitions) {
    const quarterKey = getQuarterKey(new Date(recognition.created_at));
    if (quarterKey === currentQuarterKey) currentQuarterCount += 1;
    if (quarterKey === previousQuarterKey) previousQuarterCount += 1;
  }
  const impactPercent = previousQuarterCount > 0 ? Math.round(((currentQuarterCount - previousQuarterCount) / previousQuarterCount) * 100) : currentQuarterCount > 0 ? 100 : 0;
  const thirtyDaysAgo = Date.now() - RECENT_ACTIVITY_MS;
  const activeEmployeeIds = new Set<string>();
  for (const recognition of recognitions) {
    if (new Date(recognition.created_at).getTime() < thirtyDaysAgo) continue;
    if (memberIds.includes(recognition.receiver_user_id)) activeEmployeeIds.add(recognition.receiver_user_id);
    if (recognition.giver_user_id && memberIds.includes(recognition.giver_user_id)) activeEmployeeIds.add(recognition.giver_user_id);
  }
  const engagementScore = teamTableRows.length ? Math.round((activeEmployeeIds.size / teamTableRows.length) * 100) : 0;

  return (
    <DashboardShell
      role="manager"
      title={t("overviewTitle")}
      subtitle={t("overviewSubtitle")}
      user={{
        name: `${managerProfile.first_name} ${managerProfile.last_name}`.trim(),
        initials: getInitials(managerProfile.first_name, managerProfile.last_name),
        team: teamLabel
      }}
      actions={<span className="quality-pill">{t("liveData")}</span>}
      unreadNotifications={unreadNotifications}
    >
      <section className="metrics-grid">
        <MetricCard icon={<Heart />} value={recognitions.length} label={t("totalRecognitions")} />
        <MetricCard icon={<UsersRound />} value={`${engagementScore}%`} label={t("teamEngagement")} tone="var(--theme-emerald)" iconBackground="rgba(58, 166, 95, 0.12)" />
        <MetricCard icon={<UserRound />} value={teamTableRows.length} label={t("activeMembers")} tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
        <MetricCard icon={<Activity />} value={signalItems.length} label={t("signals")} />
      </section>

      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <h2>{t("teamTable")}</h2>
          </div>
          {teamTableRows.length ? (
            <TeamTable people={teamTableRows} />
          ) : (
            <EmptyState eyebrow={t("emptyMembersEyebrow")} title={t("emptyMembersTitle")} copy={t("emptyMembersCopy")} />
          )}
        </article>
        <aside className="panel dashboard-panel">
          <div className="panel-top">
            <h2>{t("teamSignals")}</h2>
            <a href={signalsHref} style={{ color: "var(--theme-ink)", fontWeight: 700 }}>
              View all
            </a>
          </div>
          {signalItems.length ? (
            <SignalList items={signalItems} />
          ) : (
            <EmptyState eyebrow={t("emptyNoSignalsEyebrow")} title={t("emptyNoSignalsTitle")} copy={t("emptyNoSignalsCopy")} />
          )}
        </aside>
      </section>

      <section className="dashboard-grid three">
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <h2>{t("activityTitle")}</h2>
            <span className="quality-pill">{t("thisQuarter")}</span>
          </div>
          {recognitions.length ? (
            <BarChart items={trendLabels.map((label, index) => ({ label, value: trendPoints[index] ?? 0, color: "var(--theme-ink)" }))} />
          ) : (
            <EmptyState eyebrow={t("emptyActivityYetEyebrow")} title={t("emptyActivityTitle")} copy={t("emptyActivityYetCopy")} />
          )}
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <h2>{t("topQualitiesTitle")}</h2>
          </div>
          {topQualityBars.length ? (
            <QualityBars items={topQualityBars} />
          ) : (
            <EmptyState eyebrow={t("emptyQualitiesYetEyebrow")} title={t("emptyQualitiesYetTitle")} copy={t("emptyQualitiesYetCopy")} />
          )}
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <h2>{t("impactTitle")}</h2>
            <span className="quality-pill">{t("thisQuarter")}</span>
          </div>
          {recognitions.length ? (
            <>
              <BarChart
                compact
                items={[
                  { label: t("lastQuarter"), value: previousQuarterCount, color: "rgba(42, 23, 61, 0.32)" },
                  { label: t("thisQuarter"), value: currentQuarterCount, color: "var(--theme-emerald)" },
                  {
                    label: t("impactChange"),
                    value: Math.abs(impactPercent),
                    valueLabel: `${impactPercent > 0 ? "+" : ""}${impactPercent}%`,
                    color: impactPercent >= 0 ? "var(--theme-gold)" : "var(--theme-red)",
                    helper: previousQuarterCount > 0 ? t("comparedLast") : t("comparedEmpty")
                  }
                ]}
              />
              <div className="impact-card manager-impact-legacy" aria-hidden="true">
              <div className="hero-growth-badge">{impactPercent >= 0 ? "↑" : "↓"}</div>
              <strong style={{ display: "block", marginTop: 18, fontSize: 52, color: "var(--theme-ink-soft)" }}>
                {impactPercent > 0 ? "+" : ""}
                {impactPercent}%
              </strong>
              <p style={{ margin: "8px 0 0", color: "var(--theme-muted)" }}>
                {previousQuarterCount > 0
                  ? t("impactCopy")
                  : t("impactCopyEmpty")}
              </p>
              </div>
            </>
          ) : (
            <EmptyState eyebrow={t("emptyImpactEyebrow")} title={t("emptyImpactTitle")} copy={t("emptyImpactCopyAlt")} />
          )}
        </article>
      </section>
    </DashboardShell>
  );
}
