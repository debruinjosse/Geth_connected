import { redirect } from "next/navigation";
import { EmployeeDashboardClient } from "@/components/EmployeeDashboardClient";
import type { RecognitionItem } from "@/components/RecognitionList";
import { categoryMeta, getCategoryDisplayName } from "@/lib/cards";
import { currentUser, employeeCategoryBreakdown, employeeGrowthPoints, employeeTopQualities, recognitions } from "@/lib/demo-data";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "GU";
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default async function EmployeeDashboardPage() {
  if (!hasSupabaseServerConfig()) {
    return <EmployeeDashboardClient />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, team_id, company_id")
    .eq("id", user.id)
    .maybeSingle<{ id: string; first_name: string; last_name: string; email: string; team_id: string | null; company_id: string | null }>();

  if (profileError || !profile) {
    redirect("/login?error=missing_profile");
  }

  const [{ data: team }, { data: receivedRows, error: receivedError }, { count: givenCount }] = await Promise.all([
    profile.team_id
      ? supabase.from("teams").select("name").eq("id", profile.team_id).maybeSingle<{ name: string }>()
      : Promise.resolve({ data: null }),
    supabase
      .from("recognition_events")
      .select("id, created_at, personal_note, giver_name, giver_email, giver_user_id, card:card_library(title, category)")
      .eq("receiver_user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("recognition_events").select("id", { count: "exact", head: true }).eq("giver_user_id", user.id)
  ]);

  if (receivedError) {
    throw new Error("Failed to load employee recognitions.");
  }

  const received = (receivedRows ?? []) as Array<{
    id: string;
    created_at: string;
    personal_note: string | null;
    giver_name: string | null;
    giver_email: string | null;
    giver_user_id: string | null;
    card: { title: string; category: string } | Array<{ title: string; category: string }> | null;
  }>;

  const giverIds = Array.from(new Set(received.map((item) => item.giver_user_id).filter((value): value is string => Boolean(value))));
  const { data: giverProfiles } = giverIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name").in("id", giverIds)
    : { data: [] as Array<{ id: string; first_name: string; last_name: string }> };

  const giverMap = new Map((giverProfiles ?? []).map((giver) => [giver.id, `${giver.first_name} ${giver.last_name}`.trim()]));

  const normalizedRecognitions: RecognitionItem[] = received.flatMap((item) => {
      const card = Array.isArray(item.card) ? item.card[0] : item.card;
      if (!card) {
        return [];
      }

      const from =
        (item.giver_user_id ? giverMap.get(item.giver_user_id) : null) ||
        item.giver_name ||
        item.giver_email ||
        "Recognition";

      return [
        {
          id: item.id,
          from,
          card: card.title,
          category: card.category,
          note: item.personal_note ?? "Recognition recorded without a personal note.",
          createdAt: item.created_at
        } satisfies RecognitionItem
      ];
    });

  const categoryCounts = new Map<string, number>();
  const qualityCounts = new Map<string, { count: number; category: string }>();

  for (const recognition of normalizedRecognitions) {
    categoryCounts.set(recognition.category, (categoryCounts.get(recognition.category) ?? 0) + 1);
    const existing = qualityCounts.get(recognition.card);
    qualityCounts.set(recognition.card, {
      count: (existing?.count ?? 0) + 1,
      category: recognition.category
    });
  }

  const topQualities = Array.from(qualityCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([label, info]) => ({
      label,
      tone: categoryMeta[info.category as keyof typeof categoryMeta]?.color ?? "var(--theme-ink)"
    }));

  const categoryBreakdown = Array.from(categoryCounts.entries())
    .map(([category, value]) => ({
      label: getCategoryDisplayName(category),
      value,
      color: categoryMeta[category as keyof typeof categoryMeta]?.color ?? "var(--theme-ink)"
    }))
    .sort((a, b) => b.value - a.value);

  const growthReference = new Date();
  const growthMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(growthReference.getFullYear(), growthReference.getMonth() - (5 - index), 1);
    return {
      key: getMonthKey(date),
      label: new Intl.DateTimeFormat("en", { month: "short" }).format(date)
    };
  });

  const growthCounts = new Map(growthMonths.map((month) => [month.key, 0]));
  for (const recognition of normalizedRecognitions) {
    const createdDate = new Date(recognition.createdAt ?? "");
    const key = getMonthKey(createdDate);
    if (growthCounts.has(key)) {
      growthCounts.set(key, (growthCounts.get(key) ?? 0) + 1);
    }
  }

  const growthPoints = growthMonths.map((month) => growthCounts.get(month.key) ?? 0);
  const growthLabels = growthMonths.map((month) => month.label);
  const quarterKeys = new Set(
    normalizedRecognitions.map((recognition) => {
      const date = new Date(recognition.createdAt ?? "");
      return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
    })
  );

  const recent30DaysCount = normalizedRecognitions.filter((recognition) => {
    const createdAt = new Date(recognition.createdAt ?? "");
    return Date.now() - createdAt.getTime() <= 30 * 24 * 60 * 60 * 1000;
  }).length;

  const energyScore = normalizedRecognitions.length
    ? Math.min(96, Math.max(42, normalizedRecognitions.length * 12 + recent30DaysCount * 8))
    : 0;
  const unreadNotifications = await getUnreadNotificationCount(supabase, user.id);

  return (
    <EmployeeDashboardClient
      data={{
        mode: "supabase",
        user: {
          name: `${profile.first_name} ${profile.last_name}`.trim(),
          initials: getInitials(profile.first_name, profile.last_name),
          team: team?.name ?? "No team assigned"
        },
        title: `Welcome back, ${profile.first_name}!`,
        subtitle: normalizedRecognitions.length ? "Great to see your impact grow." : "Your first recognition will unlock your personal growth story.",
        actionsLabel: "Live data",
        cardsReceived: normalizedRecognitions.length,
        cardsGiven: givenCount ?? 0,
        energyScore,
        quartersActive: quarterKeys.has("NaN-QNaN") ? Math.max(quarterKeys.size - 1, 0) : quarterKeys.size,
        topQualitiesCount: qualityCounts.size,
        topQualities,
        categoryBreakdown,
        recentRecognitions: normalizedRecognitions.slice(0, 6),
        growthPoints,
        growthLabels,
        unreadNotifications
      }}
    />
  );
}
