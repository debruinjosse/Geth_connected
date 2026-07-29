import type { SupabaseClient } from "@supabase/supabase-js";
import { categoryMeta } from "@/lib/cards";

type CompanyProfileRow = {
  id: string;
  team_id: string | null;
  role: string;
  status: "active" | "invited" | "disabled" | string | null;
};

export type CompanyTeamRow = {
  id: string;
  name: string;
  manager_id: string | null;
};

type RecognitionCardRow = {
  id: string;
  title: string;
  category: string;
  card_number?: number | null;
  qr_slug?: string | null;
};

type CompanyRecognitionRow = {
  id: string;
  team_id: string | null;
  receiver_user_id: string;
  giver_user_id: string | null;
  card_id: string;
  claimed_at: string | null;
  created_at: string;
  card: RecognitionCardRow | RecognitionCardRow[] | null;
};

export type CompanyTopQuality = {
  label: string;
  category: string;
  value: number;
  count: number;
};

export type CompanyCategorySegment = {
  label: string;
  category: string;
  color: string;
  count: number;
  share: number;
  roundedShare: number;
};

export type CompanyTeamComparison = {
  label: string;
  value: number;
  activeCount: number;
  memberCount: number;
  recognitionCount: number;
};

export type ComparisonState = "positive" | "negative" | "neutral" | "new";

export type ComparisonMetric = {
  value: number | null;
  label: string;
  state: ComparisonState;
};

export type CompanyDashboardInsights = {
  totalRecognitions: number;
  totalEmployees: number;
  totalTeams: number;
  totalManagers: number;
  engagementScore: number;
  engagementDelta: ComparisonMetric;
  recognitionRate: number;
  recognitionRateDelta: ComparisonMetric;
  recognitionTrendPercent: number | null;
  recognitionTrendState: ComparisonState;
  recognitionTrendLabel: string;
  currentPeriodRecognitions: number;
  previousPeriodRecognitions: number;
  recognitionSparkline: number[];
  topQualities: CompanyTopQuality[];
  categorySegments: CompanyCategorySegment[];
  teamComparisonRows: CompanyTeamComparison[];
  maxTeamValue: number;
  trendLabels: string[];
  trendPoints: number[];
  comparisonLabels: string[];
  comparisonPoints: number[];
};

const WORKFORCE_ROLES = new Set(["employee", "manager"]);
const FOUR_C_CATEGORIES = ["Communication", "Creativity", "Competence", "Collegiality"] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

function getRecognitionDate(recognition: Pick<CompanyRecognitionRow, "claimed_at" | "created_at">) {
  return new Date(recognition.claimed_at ?? recognition.created_at);
}

function isActiveWorkforceProfile(profile: CompanyProfileRow) {
  return WORKFORCE_ROLES.has(profile.role) && profile.status === "active";
}

function getSingleCard(card: CompanyRecognitionRow["card"]) {
  return Array.isArray(card) ? card[0] : card;
}

function getPercentage(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function getRate(receivers: Set<string>, workforce: CompanyProfileRow[]) {
  if (!workforce.length) return 0;
  return getPercentage(workforce.filter((profile) => receivers.has(profile.id)).length, workforce.length);
}

function getActivityUserIds(recognitions: CompanyRecognitionRow[], workforceIds: Set<string>) {
  const activeIds = new Set<string>();

  for (const recognition of recognitions) {
    if (workforceIds.has(recognition.receiver_user_id)) {
      activeIds.add(recognition.receiver_user_id);
    }

    if (recognition.giver_user_id && workforceIds.has(recognition.giver_user_id)) {
      activeIds.add(recognition.giver_user_id);
    }
  }

  return activeIds;
}

function getComparison(current: number, previous: number): ComparisonMetric {
  if (previous === 0 && current === 0) {
    return { value: 0, label: "0%", state: "neutral" };
  }

  if (previous === 0) {
    return { value: null, label: "New", state: "new" };
  }

  const value = Math.round(((current - previous) / previous) * 100);
  const sign = value > 0 ? "+" : "";
  return {
    value,
    label: `${sign}${value}%`,
    state: value > 0 ? "positive" : value < 0 ? "negative" : "neutral"
  };
}

function getPointComparison(current: number, previous: number): ComparisonMetric {
  if (previous === 0 && current === 0) {
    return { value: 0, label: "0%", state: "neutral" };
  }

  if (previous === 0) {
    return { value: null, label: "New", state: "new" };
  }

  const value = current - previous;
  const sign = value > 0 ? "+" : "";
  return {
    value,
    label: `${sign}${value}%`,
    state: value > 0 ? "positive" : value < 0 ? "negative" : "neutral"
  };
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthWindows(size: number, now: Date) {
  const recent = Array.from({ length: size }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (size - 1 - index), 1);
    return {
      key: getMonthKey(date),
      label: new Intl.DateTimeFormat("en", { month: "short" }).format(date)
    };
  });

  const previous = Array.from({ length: size }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (size * 2 - 1 - index), 1);
    return {
      key: getMonthKey(date),
      label: new Intl.DateTimeFormat("en", { month: "short" }).format(date)
    };
  });

  return { recent, previous };
}

function getCategoryKey(category: string) {
  switch (category) {
    case "Communicatie":
      return "Communication";
    case "Creativiteit":
      return "Creativity";
    case "Competentie":
      return "Competence";
    case "Collegialiteit":
      return "Collegiality";
    case "Open kaart":
      return "Open Category";
    default:
      return category;
  }
}

function buildSparkline(recognitions: CompanyRecognitionRow[], currentStart: Date, now: Date) {
  const buckets = [0, 0, 0, 0, 0, 0];
  const bucketMs = (now.getTime() - currentStart.getTime()) / buckets.length;

  if (bucketMs <= 0) return buckets;

  for (const recognition of recognitions) {
    const time = getRecognitionDate(recognition).getTime();
    if (time < currentStart.getTime() || time > now.getTime()) continue;
    const index = Math.min(buckets.length - 1, Math.floor((time - currentStart.getTime()) / bucketMs));
    buckets[index] += 1;
  }

  return buckets;
}

export async function fetchCompanyDashboardInsights(supabase: SupabaseClient, companyId: string): Promise<CompanyDashboardInsights> {
  const now = new Date();
  const currentStart = new Date(now.getTime() - 30 * DAY_MS);
  const previousStart = new Date(now.getTime() - 60 * DAY_MS);

  const [{ data: profiles, error: profilesError }, { data: teams, error: teamsError }, { data: recognitions, error: recognitionsError }] =
    await Promise.all([
      supabase.from("profiles").select("id, team_id, role, status").eq("company_id", companyId),
      supabase.from("teams").select("id, name, manager_id").eq("company_id", companyId).order("name"),
      supabase
        .from("recognition_events")
        .select("id, team_id, receiver_user_id, giver_user_id, card_id, claimed_at, created_at, card:card_library(id, title, category, card_number, qr_slug)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
    ]);

  if (profilesError || teamsError || recognitionsError) {
    throw new Error("Failed to load company dashboard insights.");
  }

  const companyProfiles = (profiles ?? []) as CompanyProfileRow[];
  const companyTeams = (teams ?? []) as CompanyTeamRow[];
  const companyRecognitions = (recognitions ?? []) as CompanyRecognitionRow[];
  const workforce = companyProfiles.filter(isActiveWorkforceProfile);
  const workforceIds = new Set(workforce.map((profile) => profile.id));
  const managers = workforce.filter((profile) => profile.role === "manager");

  const currentPeriodRecognitions = companyRecognitions.filter((recognition) => {
    const date = getRecognitionDate(recognition);
    return date >= currentStart && date <= now;
  });
  const previousPeriodRecognitions = companyRecognitions.filter((recognition) => {
    const date = getRecognitionDate(recognition);
    return date >= previousStart && date < currentStart;
  });

  const currentReceiverIds = new Set(currentPeriodRecognitions.map((recognition) => recognition.receiver_user_id));
  const previousReceiverIds = new Set(previousPeriodRecognitions.map((recognition) => recognition.receiver_user_id));
  const currentActiveUserIds = getActivityUserIds(currentPeriodRecognitions, workforceIds);
  const previousActiveUserIds = getActivityUserIds(previousPeriodRecognitions, workforceIds);
  const engagementScore = getRate(currentActiveUserIds, workforce);
  const previousEngagementScore = getRate(previousActiveUserIds, workforce);
  const currentRate = getRate(currentReceiverIds, workforce);
  const previousRate = getRate(previousReceiverIds, workforce);

  const qualityCounts = new Map<string, { count: number; category: string }>();
  const categoryCounts = new Map<string, number>();
  const teamCounts = new Map<string, number>();
  const monthlyCounts = new Map<string, number>();

  for (const recognition of companyRecognitions) {
    const card = getSingleCard(recognition.card);
    if (card) {
      const category = getCategoryKey(card.category);
      const qualityKey = `${card.id}:${card.title}`;
      const existingQuality = qualityCounts.get(qualityKey);
      qualityCounts.set(qualityKey, {
        count: (existingQuality?.count ?? 0) + 1,
        category
      });
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }

    if (recognition.team_id) {
      teamCounts.set(recognition.team_id, (teamCounts.get(recognition.team_id) ?? 0) + 1);
    }

    const monthKey = getMonthKey(getRecognitionDate(recognition));
    monthlyCounts.set(monthKey, (monthlyCounts.get(monthKey) ?? 0) + 1);
  }

  const totalRecognitions = companyRecognitions.length;
  const categorySegments = FOUR_C_CATEGORIES.map((category) => {
    const meta = categoryMeta[category];
    const count = categoryCounts.get(category) ?? 0;
    const share = totalRecognitions ? (count / totalRecognitions) * 100 : 0;
    return {
      label: meta.label,
      category,
      color: meta.color,
      count,
      share,
      roundedShare: totalRecognitions ? Math.round(share) : 0
    };
  });

  const topQualities = Array.from(qualityCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([key, info]) => {
      const label = key.slice(key.indexOf(":") + 1);
      return {
        label,
        category: info.category,
        count: info.count,
        value: totalRecognitions ? Math.round((info.count / totalRecognitions) * 100) : 0
      };
    });

  const teamComparisonRows = companyTeams
    .map((team) => {
      const teamWorkforceIds = new Set(
        workforce.filter((profile) => profile.team_id === team.id).map((profile) => profile.id)
      );

      if (team.manager_id && workforceIds.has(team.manager_id)) {
        teamWorkforceIds.add(team.manager_id);
      }

      const teamActiveIds = getActivityUserIds(
        currentPeriodRecognitions.filter(
          (recognition) =>
            teamWorkforceIds.has(recognition.receiver_user_id) ||
            Boolean(recognition.giver_user_id && teamWorkforceIds.has(recognition.giver_user_id))
        ),
        teamWorkforceIds
      );
      const memberCount = teamWorkforceIds.size;
      const recognitionCount = teamCounts.get(team.id) ?? 0;

      return {
        label: team.name,
        value: getPercentage(teamActiveIds.size, memberCount),
        activeCount: teamActiveIds.size,
        memberCount,
        recognitionCount
      };
    })
    .sort((a, b) => b.value - a.value || b.recognitionCount - a.recognitionCount)
    .slice(0, 5);

  const { recent, previous } = getMonthWindows(6, now);
  const trendPoints = recent.map((month) => monthlyCounts.get(month.key) ?? 0);
  const comparisonPoints = previous.map((month) => monthlyCounts.get(month.key) ?? 0);
  const recognitionTrend = getComparison(currentPeriodRecognitions.length, previousPeriodRecognitions.length);

  return {
    totalRecognitions,
    totalEmployees: workforce.length,
    totalTeams: companyTeams.length,
    totalManagers: managers.length,
    engagementScore,
    engagementDelta: getPointComparison(engagementScore, previousEngagementScore),
    recognitionRate: currentRate,
    recognitionRateDelta: getPointComparison(currentRate, previousRate),
    recognitionTrendPercent: recognitionTrend.value,
    recognitionTrendState: recognitionTrend.state,
    recognitionTrendLabel: recognitionTrend.label,
    currentPeriodRecognitions: currentPeriodRecognitions.length,
    previousPeriodRecognitions: previousPeriodRecognitions.length,
    recognitionSparkline: buildSparkline(companyRecognitions, currentStart, now),
    topQualities,
    categorySegments,
    teamComparisonRows,
    maxTeamValue: 100,
    trendLabels: recent.map((month) => month.label),
    trendPoints,
    comparisonLabels: previous.map((month) => month.label),
    comparisonPoints
  };
}
