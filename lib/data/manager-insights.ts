import type { SupabaseClient } from "@supabase/supabase-js";
import type { QualityBarItem } from "@/components/QualityBars";
import type { TeamMemberRow } from "@/components/TeamTable";

export type ManagerInsights = {
  profile: {
    first_name: string | null;
    last_name: string | null;
  };
  teamLabel: string;
  teamIds: string[];
  teamRows: TeamMemberRow[];
  signalItems: Array<{ id: string; tone: string; title: string; detail: string }>;
  trendPoints: number[];
  trendLabels: string[];
  qualityBars: QualityBarItem[];
  memberComparison: Array<{ label: string; value: number }>;
  recognitionCount: number;
};

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
  if (totalReceived >= 3 || recentReceived >= 2) return "HOOG";
  if (totalReceived >= 1 || recentReceived >= 1) return "GEMIDDELD";
  return "LAAG";
}

export async function getManagerInsights(supabase: SupabaseClient, userId: string): Promise<ManagerInsights> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", userId)
    .maybeSingle<{ first_name: string | null; last_name: string | null }>();

  if (profileError || !profile) {
    throw new Error("missing_profile");
  }

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name")
    .eq("manager_id", userId);

  if (teamsError) {
    throw new Error("Failed to load managed teams.");
  }

  const managedTeams = teams ?? [];
  const teamIds = managedTeams.map((team) => team.id);
  const teamNameMap = new Map(managedTeams.map((team) => [team.id, team.name]));
  const teamLabel = managedTeams.length === 1 ? managedTeams[0]?.name ?? "Assigned team" : managedTeams.length ? `${managedTeams.length} managed teams` : "No team assigned";

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
      recognitionCount: 0
    };
  }

  const [{ data: members, error: membersError }, { data: recognitionRows, error: recognitionsError }] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name, team_id").in("team_id", teamIds),
    supabase
      .from("recognition_events")
      .select("id, receiver_user_id, giver_user_id, team_id, created_at, card:card_library(title, category)")
      .in("team_id", teamIds)
      .order("created_at", { ascending: false })
  ]);

  if (membersError || recognitionsError) {
    throw new Error("Failed to load manager team data.");
  }

  const memberRows = (members ?? []) as Array<{ id: string; first_name: string | null; last_name: string | null; team_id: string | null }>;
  const recognitions = (recognitionRows ?? []) as Array<{
    id: string;
    receiver_user_id: string;
    giver_user_id: string | null;
    team_id: string | null;
    created_at: string;
    card: { title: string; category: string } | Array<{ title: string; category: string }> | null;
  }>;

  const memberIds = new Set(memberRows.map((member) => member.id));
  const recognitionsByReceiver = new Map<string, typeof recognitions>();
  const recognitionsByGiver = new Map<string, typeof recognitions>();
  const qualityCounts = new Map<string, { value: number; category: string }>();
  const monthlyCounts = new Map<string, number>();

  for (const recognition of recognitions) {
    const card = Array.isArray(recognition.card) ? recognition.card[0] : recognition.card;
    if (card) {
      const existing = qualityCounts.get(card.title);
      qualityCounts.set(card.title, { value: (existing?.value ?? 0) + 1, category: card.category });
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
    const recentReceived = received.filter((recognition) => Date.now() - new Date(recognition.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000).length;
    const topQualityCounter = new Map<string, number>();
    for (const recognition of received) {
      const card = Array.isArray(recognition.card) ? recognition.card[0] : recognition.card;
      if (card) topQualityCounter.set(card.title, (topQualityCounter.get(card.title) ?? 0) + 1);
    }

    return {
      id: member.id,
      name: `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim() || "Team member",
      team: teamNameMap.get(member.team_id ?? "") ?? "Assigned team",
      cardsReceived: received.length,
      cardsGiven: given.length,
      trend: getTrendForDates(received.map((recognition) => recognition.created_at)),
      energy: getEnergyBucket(received.length, recentReceived),
      topQuality: Array.from(topQualityCounter.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "No recognitions yet"
    };
  });

  const signalItems = teamRows
    .filter((member) => member.cardsReceived === 0 || member.energy === "LAAG")
    .slice(0, 6)
    .map((member) => ({
      id: `signal-${member.id}`,
      tone: member.cardsReceived === 0 ? "var(--theme-red)" : "var(--theme-gold)",
      title: member.cardsReceived === 0 ? `${member.name} has not received a card yet` : `${member.name} needs recognition support`,
      detail: member.cardsReceived === 0 ? "Create a moment of recognition to get them started." : "Recent recognition activity is below the team average."
    }));

  if (!signalItems.length && teamRows.length) {
    signalItems.push({
      id: "signal-positive",
      tone: "var(--theme-emerald)",
      title: "Recognition momentum is healthy",
      detail: "Every team member has recognition activity in the current dataset."
    });
  }

  const monthWindows = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(new Date().getFullYear(), new Date().getMonth() - (5 - index), 1);
    return { key: getMonthKey(date), label: new Intl.DateTimeFormat("en", { month: "short" }).format(date) };
  });

  return {
    profile,
    teamLabel,
    teamIds,
    teamRows,
    signalItems,
    trendPoints: monthWindows.map((month) => monthlyCounts.get(month.key) ?? 0),
    trendLabels: monthWindows.map((month) => month.label),
    qualityBars: Array.from(qualityCounts.entries())
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, 6)
      .map(([label, info]) => ({
        label,
        value: recognitions.length ? Math.round((info.value / recognitions.length) * 100) : 0,
        category: info.category
      })),
    memberComparison: teamRows.map((member) => ({ label: member.name, value: member.cardsReceived })).sort((a, b) => b.value - a.value).slice(0, 8),
    recognitionCount: recognitions.length
  };
}
