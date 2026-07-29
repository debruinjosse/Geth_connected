import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { EmployeeDashboardClient } from "@/components/EmployeeDashboardClient";
import type { RecognitionItem } from "@/components/RecognitionList";
import { categoryMeta, getAnalyticCategoryLabel, getCategoryDisplayName, getLocalizedCardTitle, type CardCategory } from "@/lib/cards";
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

function getEmployeeCategoryColor(category: string) {
  switch (category) {
    case "Communication":
    case "Communicatie":
      return "var(--theme-sky)";
    case "Creativity":
    case "Creativiteit":
      return "var(--theme-emerald)";
    case "Competence":
    case "Competentie":
      return "var(--theme-gold)";
    case "Collegiality":
    case "Collegialiteit":
      return "var(--theme-purple-soft)";
    default:
      return categoryMeta[category as CardCategory]?.color ?? "var(--theme-ink)";
  }
}

function getEmployeeCategoryPersonaKeys(category: string) {
  switch (category) {
    case "Communication":
    case "Communicatie":
      return { title: "personaCommunicationTitle", story: "personaCommunicationStory" };
    case "Creativity":
    case "Creativiteit":
      return { title: "personaCreativityTitle", story: "personaCreativityStory" };
    case "Competence":
    case "Competentie":
      return { title: "personaCompetenceTitle", story: "personaCompetenceStory" };
    case "Collegiality":
    case "Collegialiteit":
      return { title: "personaCollegialityTitle", story: "personaCollegialityStory" };
    default:
      return { title: "personaDefaultTitle", story: "personaDefaultStory" };
  }
}

function formatCardEvidence(
  cards: Array<{ label: string; count: number; category: string }>,
  cardWord: (count: number) => string
) {
  if (!cards.length) {
    return "";
  }

  return cards.map((card) => `${card.label} (${card.category}, ${card.count} ${cardWord(card.count)})`).join(", ");
}

export default async function EmployeeDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "employeeDashboard" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const cardWord = (count: number) => (count === 1 ? tc("card") : tc("cards"));

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
    .select("id, first_name, last_name, email, team_id, company_id, profile_image")
    .eq("id", user.id)
    .maybeSingle<{ id: string; first_name: string; last_name: string; email: string; team_id: string | null; company_id: string | null; profile_image: string | null }>();

  if (profileError || !profile) {
    redirect("/auth/repair-profile");
  }

  const [
    { data: team },
    { data: receivedRows, error: receivedError },
    { data: givenRows, count: givenCount, error: givenError },
    { data: pendingApprovalRows, error: pendingApprovalError },
    { data: pendingAcknowledgementRows, error: pendingAcknowledgementError },
    unreadNotifications
  ] = await Promise.all([
    profile.team_id
      ? supabase.from("teams").select("name").eq("id", profile.team_id).maybeSingle<{ name: string }>()
      : Promise.resolve({ data: null }),
    supabase
      .from("recognition_events")
      .select("id, created_at, personal_note, giver_name, giver_email, giver_user_id, card:card_library(title, category, qr_slug)")
      .eq("receiver_user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("recognition_events").select("id, created_at", { count: "exact" }).eq("giver_user_id", user.id).order("created_at", { ascending: false }),
    supabase
      .from("recognition_events")
      .select("id, created_at, personal_note, receiver_user_id, status, card:card_library(title, category, qr_slug)")
      .eq("giver_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("recognition_events")
      .select("id, created_at, personal_note, giver_user_id, status, card:card_library(title, category, qr_slug)")
      .eq("receiver_user_id", user.id)
      .eq("status", "pending_acknowledgement")
      .order("created_at", { ascending: false })
      .limit(20),
    getUnreadNotificationCount(supabase, user.id)
  ]);

  if (receivedError) {
    throw new Error(t("errLoadReceived"));
  }

  if (givenError) {
    throw new Error(t("errLoadGiven"));
  }

  if (pendingApprovalError) {
    console.warn("Pending recognition approvals skipped.", pendingApprovalError.message);
  }

  if (pendingAcknowledgementError) {
    console.warn("Pending recognition acknowledgements skipped.", pendingAcknowledgementError.message);
  }

  const received = (receivedRows ?? []) as Array<{
    id: string;
    created_at: string;
    personal_note: string | null;
    giver_name: string | null;
    giver_email: string | null;
    giver_user_id: string | null;
    card: { title: string; category: string; qr_slug?: string | null } | Array<{ title: string; category: string; qr_slug?: string | null }> | null;
  }>;

  const giverIds = Array.from(new Set(received.map((item) => item.giver_user_id).filter((value): value is string => Boolean(value))));
  const { data: giverProfiles } = giverIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name").in("id", giverIds)
    : { data: [] as Array<{ id: string; first_name: string; last_name: string }> };

  const giverMap = new Map((giverProfiles ?? []).map((giver) => [giver.id, `${giver.first_name} ${giver.last_name}`.trim()]));

  const pendingRows = (pendingApprovalRows ?? []) as Array<{
    id: string;
    created_at: string;
    personal_note: string | null;
    receiver_user_id: string;
    status?: string | null;
    card: { title: string; category: string; qr_slug?: string | null } | Array<{ title: string; category: string; qr_slug?: string | null }> | null;
  }>;
  const pendingVerificationRows = pendingRows.filter((row) => row.status === "pending_verification").slice(0, 5);
  const acknowledgementRows = (pendingAcknowledgementRows ?? []) as Array<{
    id: string;
    created_at: string;
    personal_note: string | null;
    giver_user_id: string | null;
    status?: string | null;
    card: { title: string; category: string; qr_slug?: string | null } | Array<{ title: string; category: string; qr_slug?: string | null }> | null;
  }>;
  const pendingReceiverIds = Array.from(new Set(pendingVerificationRows.map((row) => row.receiver_user_id)));
  const pendingGiverIds = Array.from(new Set(acknowledgementRows.map((row) => row.giver_user_id).filter((value): value is string => Boolean(value))));
  const { data: pendingReceivers } = pendingReceiverIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name").in("id", pendingReceiverIds)
    : { data: [] as Array<{ id: string; first_name: string | null; last_name: string | null }> };
  const { data: pendingGivers } = pendingGiverIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name").in("id", pendingGiverIds)
    : { data: [] as Array<{ id: string; first_name: string | null; last_name: string | null }> };
  const pendingReceiverMap = new Map(
    (pendingReceivers ?? []).map((receiver) => [receiver.id, `${receiver.first_name ?? ""} ${receiver.last_name ?? ""}`.trim() || t("aTeammate")])
  );
  const pendingGiverMap = new Map((pendingGivers ?? []).map((giver) => [giver.id, `${giver.first_name ?? ""} ${giver.last_name ?? ""}`.trim() || t("aTeammate")]));

  const normalizedRecognitions: RecognitionItem[] = received.flatMap((item) => {
      const card = Array.isArray(item.card) ? item.card[0] : item.card;
      if (!card) {
        return [];
      }

      const from =
        (item.giver_user_id ? giverMap.get(item.giver_user_id) : null) ||
        item.giver_name ||
        item.giver_email ||
        t("recognitionFallback");

      return [
        {
          id: item.id,
          from,
          card: getLocalizedCardTitle({ title: card.title, slug: card.qr_slug ?? undefined }, locale),
          category: card.category,
          note: item.personal_note ?? t("noPersonalNote"),
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

  const topQualityDetails = Array.from(qualityCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([label, info]) => ({
      label,
      count: info.count,
      category: getCategoryDisplayName(info.category),
      rawCategory: info.category,
      tone: getEmployeeCategoryColor(info.category)
    }));
  const topQualities = topQualityDetails.map(({ label, count, tone }) => ({ label, count, tone }));

  const topCategory = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1])[0];

  const fourCCategories: CardCategory[] = ["Communication", "Creativity", "Competence", "Collegiality"];
  const categoryBreakdown = fourCCategories
    .map((category) => ({
      label: getCategoryDisplayName(category),
      value: categoryCounts.get(category) ?? 0,
      color: getEmployeeCategoryColor(category)
    }))
    .sort((a, b) => b.value - a.value);

  const growthReference = new Date();
  const growthMonths = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(growthReference.getFullYear(), growthReference.getMonth() - (5 - index), 1);
    return {
      key: getMonthKey(date),
      label: new Intl.DateTimeFormat(locale, { month: "short" }).format(date)
    };
  });

  const growthCounts = new Map(growthMonths.map((month) => [month.key, 0]));
  const givenGrowthCounts = new Map(growthMonths.map((month) => [month.key, 0]));
  for (const recognition of normalizedRecognitions) {
    const createdDate = new Date(recognition.createdAt ?? "");
    const key = getMonthKey(createdDate);
    if (growthCounts.has(key)) {
      growthCounts.set(key, (growthCounts.get(key) ?? 0) + 1);
    }
  }
  for (const recognition of givenRows ?? []) {
    const createdDate = new Date(recognition.created_at ?? "");
    const key = getMonthKey(createdDate);
    if (givenGrowthCounts.has(key)) {
      givenGrowthCounts.set(key, (givenGrowthCounts.get(key) ?? 0) + 1);
    }
  }

  const growthPoints = growthMonths.map((month) => growthCounts.get(month.key) ?? 0);
  const givenGrowthPoints = growthMonths.map((month) => givenGrowthCounts.get(month.key) ?? 0);
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
  const recognitionSignals = [];
  const topThreeCards = topQualityDetails.slice(0, 3);
  const aiCategory = topCategory?.[0] ?? topThreeCards[0]?.rawCategory;
  const aiPersonaKeys = getEmployeeCategoryPersonaKeys(aiCategory ?? "");

  if (!normalizedRecognitions.length) {
    recognitionSignals.push({
      id: "employee-signal-empty",
      tone: "var(--theme-gold)",
      title: t("emptySignalTitle"),
      detail: t("emptySignalDetail")
    });
  } else {
    recognitionSignals.push({
      id: "employee-ai-recognition-story",
      tone: getEmployeeCategoryColor(aiCategory ?? ""),
      title: t(aiPersonaKeys.title),
      detail: t("storyEvidence", {
        story: t(aiPersonaKeys.story),
        evidence: formatCardEvidence(topThreeCards, cardWord),
        pace: recent30DaysCount >= 5 ? t("paceConsistent") : t("paceGrowing")
      }),
      highlights: topThreeCards.map((card) => ({
        label: card.label,
        category: card.category,
        count: card.count,
        tone: card.tone
      }))
    });
  }
  const topStrengthLabel = topCategory ? getAnalyticCategoryLabel(topCategory[0]) : t("noSignalYet");
  const pendingApprovals = pendingVerificationRows.flatMap((row) => {
    const card = Array.isArray(row.card) ? row.card[0] : row.card;
    if (!card) return [];

    return [{
      id: row.id,
      kind: "giver_verification" as const,
      receiverName: pendingReceiverMap.get(row.receiver_user_id) ?? t("aTeammate"),
      cardTitle: getLocalizedCardTitle({ title: card.title, slug: card.qr_slug ?? undefined }, locale),
      category: getCategoryDisplayName(card.category),
      note: row.personal_note,
      createdAt: row.created_at
    }];
  });
  const pendingAcknowledgements = acknowledgementRows.flatMap((row) => {
    const card = Array.isArray(row.card) ? row.card[0] : row.card;
    if (!card) return [];

    return [{
      id: row.id,
      kind: "receiver_acknowledgement" as const,
      receiverName: `${profile.first_name} ${profile.last_name}`.trim() || t("you"),
      giverName: row.giver_user_id ? pendingGiverMap.get(row.giver_user_id) ?? t("aTeammate") : t("aTeammate"),
      cardTitle: getLocalizedCardTitle({ title: card.title, slug: card.qr_slug ?? undefined }, locale),
      category: getCategoryDisplayName(card.category),
      note: row.personal_note,
      createdAt: row.created_at
    }];
  });

  return (
    <EmployeeDashboardClient
      data={{
        mode: "supabase",
        user: {
          name: `${profile.first_name} ${profile.last_name}`.trim(),
          initials: getInitials(profile.first_name, profile.last_name),
          team: team?.name ?? t("noTeam"),
          imageUrl: profile.profile_image
        },
        title: t("welcomeBack", { name: profile.first_name }),
        subtitle: normalizedRecognitions.length ? t("subtitleActive") : t("subtitleEmpty"),
        actionsLabel: t("liveData"),
        cardsReceived: normalizedRecognitions.length,
        cardsGiven: givenCount ?? 0,
        energyScore,
        quartersActive: quarterKeys.has("NaN-QNaN") ? Math.max(quarterKeys.size - 1, 0) : quarterKeys.size,
        topQualitiesCount: qualityCounts.size,
        topStrengthLabel,
        recognitionSignals,
        pendingApprovals: [...pendingAcknowledgements, ...pendingApprovals],
        topQualities,
        categoryBreakdown,
        recentRecognitions: normalizedRecognitions.slice(0, 6),
        growthPoints,
        givenGrowthPoints,
        growthLabels,
        unreadNotifications
      }}
    />
  );
}
