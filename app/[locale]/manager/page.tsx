import { redirect } from "next/navigation";
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
  if (totalReceived >= 3 || recentReceived >= 2) return "HOOG";
  if (totalReceived >= 1 || recentReceived >= 1) return "GEMIDDELD";
  return "LAAG";
}

export default async function ManagerDashboardPage() {
  if (!hasSupabaseServerConfig()) {
    return (
      <DashboardShell
        role="manager"
        title="My Team Overview"
        subtitle="Real-time insights about your team’s recognition culture."
        user={managerUser}
        actions={<span className="quality-pill">This quarter</span>}
      >
        <section className="metrics-grid">
          <MetricCard icon={<Heart />} value="124" label="Total recognitions" />
          <MetricCard icon={<UsersRound />} value="92%" label="Team engagement" tone="var(--theme-emerald)" iconBackground="rgba(58, 166, 95, 0.12)" />
          <MetricCard icon={<UserRound />} value="8" label="Active members" tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
          <MetricCard icon={<Activity />} value="4" label="Signals" />
        </section>

        <section className="dashboard-grid two">
          <article className="panel dashboard-panel">
            <div className="panel-top">
              <h2>Team table</h2>
            </div>
            <TeamTable people={people} />
          </article>
          <aside className="panel dashboard-panel">
            <div className="panel-top">
              <h2>Team signals</h2>
              <a href="/manager/signals" style={{ color: "var(--theme-ink)", fontWeight: 700 }}>
                View all
              </a>
            </div>
            <SignalList items={teamSignals} />
          </aside>
        </section>

        <section className="dashboard-grid three">
          <article className="panel dashboard-panel">
            <div className="panel-top">
              <h2>Recognition activity</h2>
              <span className="quality-pill">This quarter</span>
            </div>
            <BarChart items={["Jul", "Aug", "Sep"].map((label, index) => ({ label, value: managerTrendPoints[index] ?? 0, color: "var(--theme-ink)" }))} />
          </article>
          <article className="panel dashboard-panel">
            <div className="panel-top">
              <h2>Top qualities bars</h2>
            </div>
            <QualityBars items={topQualities} />
          </article>
          <article className="panel dashboard-panel">
            <div className="panel-top">
              <h2>Recognition impact</h2>
              <span className="quality-pill">This quarter</span>
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
        title="My Team Overview"
        subtitle="Real-time insights about your team's recognition culture."
        user={managerUser}
        actions={<span className="quality-pill">This quarter</span>}
      >
        <section className="metrics-grid">
          <MetricCard icon={<Heart />} value="124" label="Total recognitions" />
          <MetricCard icon={<UsersRound />} value="92%" label="Team engagement" tone="var(--theme-emerald)" iconBackground="rgba(58, 166, 95, 0.12)" />
          <MetricCard icon={<UserRound />} value="8" label="Active members" tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
          <MetricCard icon={<Activity />} value="4" label="Signals" />
        </section>

        <section className="dashboard-grid two">
          <article className="panel dashboard-panel">
            <div className="panel-top">
              <h2>Team table</h2>
            </div>
            <TeamTable people={people} />
          </article>
          <aside className="panel dashboard-panel">
            <div className="panel-top">
              <h2>Team signals</h2>
              <a href="/manager/signals" style={{ color: "var(--theme-ink)", fontWeight: 700 }}>
                View all
              </a>
            </div>
            <SignalList items={teamSignals} />
          </aside>
        </section>

        <section className="dashboard-grid three">
          <article className="panel dashboard-panel">
            <div className="panel-top">
              <h2>Recognition activity</h2>
              <span className="quality-pill">This quarter</span>
            </div>
            <BarChart items={["Jul", "Aug", "Sep"].map((label, index) => ({ label, value: managerTrendPoints[index] ?? 0, color: "var(--theme-ink)" }))} />
          </article>
          <article className="panel dashboard-panel">
            <div className="panel-top">
              <h2>Top qualities bars</h2>
            </div>
            <QualityBars items={topQualities} />
          </article>
          <article className="panel dashboard-panel">
            <div className="panel-top">
              <h2>Recognition impact</h2>
              <span className="quality-pill">This quarter</span>
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
    throw new Error("Failed to load managed teams.");
  }

  const teams = managedTeams ?? [];
  const teamIds = teams.map((team) => team.id);
  const teamNameMap = new Map(teams.map((team) => [team.id, team.name]));
  const teamLabel = teams.length === 1 ? teams[0]?.name ?? "Assigned team" : teams.length > 1 ? `${teams.length} managed teams` : "No team assigned";
  const unreadNotifications = await getUnreadNotificationCount(supabase, user.id);

  if (!teamIds.length) {
    return (
      <DashboardShell
        role="manager"
        title="My Team Overview"
        subtitle="Real-time insights about your team’s recognition culture."
        user={{
          name: `${managerProfile.first_name} ${managerProfile.last_name}`.trim(),
          initials: getInitials(managerProfile.first_name, managerProfile.last_name),
          team: teamLabel
        }}
        actions={<span className="quality-pill">Live data</span>}
        unreadNotifications={unreadNotifications}
      >
        <section className="metrics-grid">
          <MetricCard icon={<Heart />} value="0" label="Total recognitions" />
          <MetricCard icon={<UsersRound />} value="0%" label="Team engagement" tone="var(--theme-emerald)" iconBackground="rgba(58, 166, 95, 0.12)" />
          <MetricCard icon={<UserRound />} value="0" label="Active members" tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
          <MetricCard icon={<Activity />} value="0" label="Signals" />
        </section>

        <section className="dashboard-grid two">
          <article className="panel dashboard-panel">
            <EmptyState
              eyebrow="No team yet"
              title="Assign a team to unlock manager insights"
              copy="Once your profile is linked as a team manager, member activity, recognitions, and signals will appear here automatically."
            />
          </article>
          <aside className="panel dashboard-panel">
            <EmptyState
              eyebrow="Signals pending"
              title="No team signals yet"
              copy="Signals will surface here after team members and recognitions start flowing through the platform."
            />
          </aside>
        </section>

        <section className="dashboard-grid three">
          <article className="panel dashboard-panel">
            <EmptyState eyebrow="Activity unavailable" title="Recognition activity will appear here" copy="Your activity bars will populate after your managed team starts receiving recognitions." />
          </article>
          <article className="panel dashboard-panel">
            <EmptyState eyebrow="No top qualities yet" title="Top qualities need team activity" copy="As cards are claimed by your team, the most frequent strengths will appear here." />
          </article>
          <article className="panel dashboard-panel">
            <EmptyState eyebrow="Impact pending" title="Recognition impact needs history" copy="Once you have recognitions in multiple quarters, this card will compare momentum over time." />
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
      .eq("role", "employee"),
    supabase
      .from("recognition_events")
      .select("id, receiver_user_id, giver_user_id, created_at, card:card_library(title, category)")
      .in("team_id", teamIds)
      .order("created_at", { ascending: false })
  ]);

  if (membersError || recognitionsError) {
    throw new Error("Failed to load manager team data.");
  }

  const memberRows = (members ?? []) as Array<{ id: string; first_name: string; last_name: string; team_id: string | null }>;
  const recognitions = (teamRecognitions ?? []) as Array<{
    id: string;
    receiver_user_id: string;
    giver_user_id: string | null;
    created_at: string;
    card: { title: string; category: string } | Array<{ title: string; category: string }> | null;
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
      const existingQuality = qualityCounts.get(card.title);
      qualityCounts.set(card.title, {
        value: (existingQuality?.value ?? 0) + 1,
        category: card.category
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
    const recent30DayReceived = receivedForMember.filter((recognition) => Date.now() - new Date(recognition.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000).length;

    const topQualityCounter = new Map<string, number>();
    for (const recognition of receivedForMember) {
      const card = Array.isArray(recognition.card) ? recognition.card[0] : recognition.card;
      if (card) {
        topQualityCounter.set(card.title, (topQualityCounter.get(card.title) ?? 0) + 1);
      }
    }
    const topQuality =
      Array.from(topQualityCounter.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "No recognitions yet";

    return {
      id: member.id,
      name: `${member.first_name} ${member.last_name}`.trim(),
      team: teamNameMap.get(member.team_id ?? "") ?? "Assigned team",
      cardsReceived: receivedForMember.length,
      cardsGiven: givenForMember.length,
      trend,
      energy: getEnergyBucket(receivedForMember.length, recent30DayReceived),
      topQuality
    };
  });

  const signalItems = teamTableRows
    .filter((member) => member.cardsReceived === 0 || member.energy === "LAAG")
    .slice(0, 4)
    .map((member, index) => ({
      id: `signal-${member.id}`,
      tone: member.cardsReceived === 0 ? "var(--theme-red)" : "var(--theme-gold)",
      title: member.cardsReceived === 0 ? `${member.name} hasn't received a card yet` : `${member.name} needs more recognition support`,
      detail: member.cardsReceived === 0 ? "Start recognition momentum for this team member." : "Recent recognition activity is below the team average."
    }));

  if (!signalItems.length && teamTableRows.length) {
    signalItems.push({
      id: "signal-positive",
      tone: "var(--theme-emerald)",
      title: "Great team momentum",
      detail: "Recognition activity is flowing consistently across your managed team."
    });
  }

  const topQualityBars: QualityBarItem[] = Array.from(qualityCounts.entries())
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 5)
    .map(([label, info]) => ({
      label,
      value: recognitions.length ? Math.round((info.value / recognitions.length) * 100) : 0,
      category: info.category
    }));

  const growthMonths = Array.from({ length: 3 }, (_, index) => {
    const date = new Date(new Date().getFullYear(), new Date().getMonth() - (2 - index), 1);
    return {
      key: getMonthKey(date),
      label: new Intl.DateTimeFormat("en", { month: "short" }).format(date)
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
  const engagementScore = teamTableRows.length ? Math.min(99, Math.max(0, Math.round((teamTableRows.filter((member) => member.cardsReceived > 0).length / teamTableRows.length) * 100))) : 0;

  return (
    <DashboardShell
      role="manager"
      title="My Team Overview"
      subtitle="Real-time insights about your team’s recognition culture."
      user={{
        name: `${managerProfile.first_name} ${managerProfile.last_name}`.trim(),
        initials: getInitials(managerProfile.first_name, managerProfile.last_name),
        team: teamLabel
      }}
      actions={<span className="quality-pill">Live data</span>}
      unreadNotifications={unreadNotifications}
    >
      <section className="metrics-grid">
        <MetricCard icon={<Heart />} value={recognitions.length} label="Total recognitions" />
        <MetricCard icon={<UsersRound />} value={`${engagementScore}%`} label="Team engagement" tone="var(--theme-emerald)" iconBackground="rgba(58, 166, 95, 0.12)" />
        <MetricCard icon={<UserRound />} value={teamTableRows.length} label="Active members" tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
        <MetricCard icon={<Activity />} value={signalItems.length} label="Signals" />
      </section>

      <section className="dashboard-grid two">
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <h2>Team table</h2>
          </div>
          {teamTableRows.length ? (
            <TeamTable people={teamTableRows} />
          ) : (
            <EmptyState eyebrow="No members yet" title="Add members to this team" copy="Once employee profiles are assigned to your managed team, they will appear here with recognition performance data." />
          )}
        </article>
        <aside className="panel dashboard-panel">
          <div className="panel-top">
            <h2>Team signals</h2>
            <a href="/manager/signals" style={{ color: "var(--theme-ink)", fontWeight: 700 }}>
              View all
            </a>
          </div>
          {signalItems.length ? (
            <SignalList items={signalItems} />
          ) : (
            <EmptyState eyebrow="No signals" title="Your team is running smoothly" copy="Signals will appear here when recognition gaps or momentum changes need your attention." />
          )}
        </aside>
      </section>

      <section className="dashboard-grid three">
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <h2>Recognition activity</h2>
            <span className="quality-pill">This quarter</span>
          </div>
          {recognitions.length ? (
            <BarChart items={trendLabels.map((label, index) => ({ label, value: trendPoints[index] ?? 0, color: "var(--theme-ink)" }))} />
          ) : (
            <EmptyState eyebrow="No activity yet" title="Recognition activity will appear here" copy="Once your team starts receiving recognitions, this chart will show monthly momentum." />
          )}
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <h2>Top qualities bars</h2>
          </div>
          {topQualityBars.length ? (
            <QualityBars items={topQualityBars} />
          ) : (
            <EmptyState eyebrow="No qualities yet" title="Top strengths need team recognitions" copy="As cards are claimed by team members, the most common strengths will surface here." />
          )}
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-top">
            <h2>Recognition impact</h2>
            <span className="quality-pill">This quarter</span>
          </div>
          {recognitions.length ? (
            <>
              <BarChart
                compact
                items={[
                  { label: "Last quarter", value: previousQuarterCount, color: "rgba(42, 23, 61, 0.32)" },
                  { label: "This quarter", value: currentQuarterCount, color: "var(--theme-emerald)" },
                  {
                    label: "Impact change",
                    value: Math.abs(impactPercent),
                    valueLabel: `${impactPercent > 0 ? "+" : ""}${impactPercent}%`,
                    color: impactPercent >= 0 ? "var(--theme-gold)" : "var(--theme-red)",
                    helper: previousQuarterCount > 0 ? "Compared with last quarter." : "Compared with an empty previous quarter."
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
                  ? `change in team recognition compared to last quarter.`
                  : "current-quarter growth compared to an empty previous quarter."}
              </p>
              </div>
            </>
          ) : (
            <EmptyState eyebrow="Impact pending" title="Recognition impact needs history" copy="After recognitions accumulate across quarters, this card will compare progress over time." />
          )}
        </article>
      </section>
    </DashboardShell>
  );
}
