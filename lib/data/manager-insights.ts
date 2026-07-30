import type { SupabaseClient } from "@supabase/supabase-js";
import type { QualityBarItem } from "@/components/QualityBars";
import type { TeamMemberRow } from "@/components/TeamTable";
import { categoryColors, getAnalyticCategoryLabel } from "@/lib/cards";

export type ManagerInsights = {
  profile: {
    first_name: string | null;
    last_name: string | null;
    profile_image: string | null;
  };
  teamLabel: string;
  teamIds: string[];
  teamRows: TeamMemberRow[];
  signalItems: Array<{ id: string; tone: string; title: string; detail: string; actionLabel?: string; actionHref?: string }>;
  trendPoints: number[];
  trendLabels: string[];
  qualityBars: QualityBarItem[];
  memberComparison: Array<{ label: string; value: number }>;
  recognitionCount: number;
  activeMemberCount: number;
  engagementScore: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_ACTIVITY_MS = 30 * DAY_MS;
const INACTIVITY_SIGNAL_MS = 14 * DAY_MS;

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getTrendForDates(dates: string[]) {
  const now = new Date();
  const currentMonth = getMonthKey(now);
  const previousMonth = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
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

type JoinedCard = { title: string; category: string; card_number?: number | null; qr_slug?: string | null };

function getDisplayCard(card: JoinedCard) {
  return {
    title: card.title,
    category: card.category
  };
}

function countByCard(received: Array<{ card: JoinedCard | Array<JoinedCard> | null }>) {
  const cardCounts = new Map<string, { value: number; category: string }>();
  const categoryCounts = new Map<string, number>();

  for (const recognition of received) {
    const card = Array.isArray(recognition.card) ? recognition.card[0] : recognition.card;
    if (!card) continue;
    const displayCard = getDisplayCard(card);
    const cardEntry = cardCounts.get(displayCard.title);
    cardCounts.set(displayCard.title, { value: (cardEntry?.value ?? 0) + 1, category: displayCard.category });
    categoryCounts.set(displayCard.category, (categoryCounts.get(displayCard.category) ?? 0) + 1);
  }

  const topCard = Array.from(cardCounts.entries()).sort((a, b) => b[1].value - a[1].value)[0];
  const topCategory = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1])[0];

  return { cardCounts, categoryCounts, topCard, topCategory };
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

type ManagerTranslator = (key: string, values?: Record<string, string | number | Date>) => string;

export async function getManagerInsights(
  supabase: SupabaseClient,
  userId: string,
  t: ManagerTranslator,
  locale: string
): Promise<ManagerInsights> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, profile_image, team_id")
    .eq("id", userId)
    .maybeSingle<{ id: string; first_name: string | null; last_name: string | null; profile_image: string | null; team_id: string | null }>();

  if (profileError || !profile) {
    throw new Error("missing_profile");
  }

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name")
    .eq("manager_id", userId);

  if (teamsError) {
    throw new Error(t("errLoadTeams"));
  }

  const managedTeams = teams ?? [];
  const teamIds = managedTeams.map((team) => team.id);
  const teamNameMap = new Map(managedTeams.map((team) => [team.id, team.name]));
  const teamLabel =
    managedTeams.length === 1
      ? managedTeams[0]?.name ?? t("assignedTeam")
      : managedTeams.length
        ? t("managedTeams", { count: managedTeams.length })
        : t("noTeam");

  if (!teamIds.length) {
    return {
      profile,
      teamLabel,
      teamIds,
      teamRows: [],
      signalItems: [],
      trendPoints: [0, 0, 0, 0, 0, 0],
      trendLabels: Array.from({ length: 6 }, (_, index) => new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(new Date().getFullYear(), new Date().getMonth() - (5 - index), 1))),
      qualityBars: [],
      memberComparison: [],
      recognitionCount: 0,
      activeMemberCount: 0,
      engagementScore: 0
    };
  }

  const [{ data: members, error: membersError }, { data: recognitionRows, error: recognitionsError }] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name, team_id").in("team_id", teamIds).in("role", ["employee", "manager"]),
    supabase
      .from("recognition_events")
      .select("id, receiver_user_id, giver_user_id, team_id, created_at, card:card_library(title, category, card_number, qr_slug)")
      .in("team_id", teamIds)
      .order("created_at", { ascending: false })
  ]);

  if (membersError || recognitionsError) {
    throw new Error(t("errLoadTeamData"));
  }

  const memberRows = (members ?? []) as Array<{ id: string; first_name: string | null; last_name: string | null; team_id: string | null }>;

  if (!memberRows.some((member) => member.id === profile.id)) {
    memberRows.push({
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      team_id: profile.team_id
    });
  }

  const recognitions = (recognitionRows ?? []) as Array<{
    id: string;
    receiver_user_id: string;
    giver_user_id: string | null;
    team_id: string | null;
    created_at: string;
    card: JoinedCard | Array<JoinedCard> | null;
  }>;

  const memberIds = new Set(memberRows.map((member) => member.id));
  const recognitionsByReceiver = new Map<string, typeof recognitions>();
  const recognitionsByGiver = new Map<string, typeof recognitions>();
  const qualityCounts = new Map<string, { value: number; category: string }>();
  const monthlyCounts = new Map<string, number>();

  for (const recognition of recognitions) {
    const card = Array.isArray(recognition.card) ? recognition.card[0] : recognition.card;
    if (card) {
      const displayCard = getDisplayCard(card);
      const existing = qualityCounts.get(displayCard.title);
      qualityCounts.set(displayCard.title, { value: (existing?.value ?? 0) + 1, category: displayCard.category });
    }

    if (!recognitionsByReceiver.has(recognition.receiver_user_id)) recognitionsByReceiver.set(recognition.receiver_user_id, []);
    recognitionsByReceiver.get(recognition.receiver_user_id)!.push(recognition);

    if (recognition.giver_user_id && memberIds.has(recognition.giver_user_id)) {
      if (!recognitionsByGiver.has(recognition.giver_user_id)) recognitionsByGiver.set(recognition.giver_user_id, []);
      recognitionsByGiver.get(recognition.giver_user_id)!.push(recognition);
    }

    const monthKey = getMonthKey(new Date(recognition.created_at));
    monthlyCounts.set(monthKey, (monthlyCounts.get(monthKey) ?? 0) + 1);
  }

  const teamRows: TeamMemberRow[] = memberRows.map((member) => {
    const received = recognitionsByReceiver.get(member.id) ?? [];
    const given = recognitionsByGiver.get(member.id) ?? [];
    const recentReceived = received.filter((recognition) => Date.now() - new Date(recognition.created_at).getTime() <= RECENT_ACTIVITY_MS).length;
    const { topCard, topCategory } = countByCard(received);
    const topQuality =
      topCategory && topCategory[1] >= 3
        ? getAnalyticCategoryLabel(topCategory[0])
        : topCard?.[0] ?? t("noRecognitionsYet");

    return {
      id: member.id,
      name: `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim() || t("teamMember"),
      team: teamNameMap.get(member.team_id ?? "") ?? t("assignedTeam"),
      cardsReceived: received.length,
      cardsGiven: given.length,
      trend: getTrendForDates(received.map((recognition) => recognition.created_at)),
      energy: getEnergyBucket(received.length, recentReceived),
      topQuality
    };
  });

  const signalItems: ManagerInsights["signalItems"] = [];

  for (const member of teamRows) {
    const received = recognitionsByReceiver.get(member.id) ?? [];
    const given = recognitionsByGiver.get(member.id) ?? [];
    const latestActivityAt = getLatestActivityTime([...received, ...given]);

    if (!latestActivityAt) {
      signalItems.push({
        id: `signal-gap-${member.id}`,
        tone: "var(--theme-red)",
        title: t("signalNoActivityTitle", { name: member.name }),
        detail: t("signalNoActivityDetail"),
        actionLabel: t("signalSendNote"),
        actionHref: "/manager/team"
      });
    } else if (Date.now() - latestActivityAt >= INACTIVITY_SIGNAL_MS) {
      signalItems.push({
        id: `signal-inactive-${member.id}`,
        tone: "var(--theme-red)",
        title: t("signalInactiveTitle", { name: member.name, weeks: getWeeksSince(latestActivityAt) }),
        detail: t("signalInactiveDetail"),
        actionLabel: t("signalSendNote"),
        actionHref: "/manager/team"
      });
    } else if (member.energy === "LAAG") {
      signalItems.push({
        id: `signal-low-${member.id}`,
        tone: "var(--theme-gold)",
        title: t("signalLowTitle", { name: member.name }),
        detail: t("signalLowDetail")
      });
    }
  }

  for (const member of teamRows) {
    const received = recognitionsByReceiver.get(member.id) ?? [];
    const { topCard, topCategory } = countByCard(received);

    if (topCard && topCard[1].value >= 5) {
      signalItems.push({
        id: `signal-card-repeat-${member.id}-${topCard[0]}`,
        tone: categoryColors[topCard[1].category] ?? "var(--theme-emerald)",
        title: t("signalRepeatTitle", { name: member.name, card: topCard[0], count: topCard[1].value }),
        detail: t("signalRepeatDetail", { name: member.name })
      });
    }

    if (topCategory && topCategory[1] >= 5) {
      signalItems.push({
        id: `signal-category-${member.id}-${topCategory[0]}`,
        tone: categoryColors[topCategory[0]] ?? "var(--theme-gold)",
        title: t("signalCategoryTitle", { name: member.name, quality: getAnalyticCategoryLabel(topCategory[0]).toLowerCase() }),
        detail: t("signalCategoryDetail", { count: topCategory[1], category: topCategory[0].toLowerCase() })
      });
    }

    if (received.length >= 5) {
      signalItems.push({
        id: `signal-streak-${member.id}`,
        tone: "var(--theme-emerald)",
        title: t("signalStreakTitle", { name: member.name }),
        detail: t("signalStreakDetail")
      });
    }
  }

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const activeEmployeeIds = new Set<string>();
  for (const recognition of recognitions) {
    if (new Date(recognition.created_at).getTime() < thirtyDaysAgo) continue;
    if (memberIds.has(recognition.receiver_user_id)) activeEmployeeIds.add(recognition.receiver_user_id);
    if (recognition.giver_user_id && memberIds.has(recognition.giver_user_id)) activeEmployeeIds.add(recognition.giver_user_id);
  }
  const activeMemberCount = activeEmployeeIds.size;
  const engagementScore = teamRows.length ? Math.round((activeMemberCount / teamRows.length) * 100) : 0;
  const activeShare = teamRows.length ? activeMemberCount / teamRows.length : 0;

  if (teamRows.length && activeShare >= 0.7) {
    signalItems.push({
      id: "signal-team-momentum",
      tone: "var(--theme-emerald)",
      title: t("signalMomentumTitle"),
      detail: t("signalMomentumDetail", { active: activeMemberCount, total: teamRows.length })
    });
  }

  if (!signalItems.length && teamRows.length) {
    signalItems.push({
      id: "signal-positive",
      tone: "var(--theme-emerald)",
      title: t("signalHealthyTitle"),
      detail: t("signalHealthyDetail")
    });
  }

  const monthWindows = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(new Date().getFullYear(), new Date().getMonth() - (5 - index), 1);
    return { key: getMonthKey(date), label: new Intl.DateTimeFormat(locale, { month: "short" }).format(date) };
  });

  return {
    profile,
    teamLabel,
    teamIds,
    teamRows,
    signalItems: signalItems.slice(0, 10),
    trendPoints: monthWindows.map((month) => monthlyCounts.get(month.key) ?? 0),
    trendLabels: monthWindows.map((month) => month.label),
    qualityBars: (() => {
      const topEntries = Array.from(qualityCounts.entries()).sort((a, b) => b[1].value - a[1].value).slice(0, 6);
      const percentages = getPercentageMix(topEntries.map(([, info]) => ({ value: info.value })));

      return topEntries.map(([label, info], index) => ({
        label,
        value: percentages[index] ?? 0,
        category: info.category
      }));
    })(),
    memberComparison: teamRows.map((member) => ({ label: member.name, value: member.cardsReceived })).sort((a, b) => b.value - a.value).slice(0, 8),
    recognitionCount: recognitions.length,
    activeMemberCount,
    engagementScore
  };
}
