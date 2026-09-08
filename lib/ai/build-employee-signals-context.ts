import type { SupabaseClient } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";
import {
  categoryMeta,
  getLocalizedCardTitle,
  getLocalizedCategoryDisplayName,
  normalizeCategoryKey,
  type CardCategory
} from "@/lib/cards";
import type { EmployeeSignalsContext } from "@/lib/ai/employee-recognition-signals";

/**
 * Builds the exact `EmployeeSignalsContext` shape that `fetchEmployeeRecognitionSignals`
 * (`app/actions/employeeSignals.ts`) expects, so the web employee dashboard
 * (`app/[locale]/employee/page.tsx`) and the mobile `growth-insights` API route compute this one
 * piece identically. Self-contained by design: it runs its own queries rather than sharing
 * intermediate values with the dashboard page's other (unrelated) rendering — the growth chart,
 * recognition list, pending-approval cards, and "energy score" there are untouched by this
 * extraction and still compute their own copies of similar data, as they did before.
 *
 * This mirrors (not reuses) the category-color and aggregation logic in `app/[locale]/employee/
 * page.tsx` verbatim, minus the giver-name resolution query — not needed here since signals-
 * context fields never surface a giver's name.
 */

type ReceivedRecognitionRow = {
  id: string;
  created_at: string;
  personal_note: string | null;
  card: { title: string; category: string; qr_slug?: string | null } | Array<{ title: string; category: string; qr_slug?: string | null }> | null;
};

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

export async function buildEmployeeSignalsContext(
  supabase: SupabaseClient,
  userId: string,
  locale: string
): Promise<EmployeeSignalsContext> {
  const t = await getTranslations({ locale, namespace: "employeeDashboard" });

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, team_id")
    .eq("id", userId)
    .maybeSingle<{ first_name: string; last_name: string; team_id: string | null }>();

  const [{ data: team }, { data: receivedRows }, { count: givenCount }] = await Promise.all([
    profile?.team_id
      ? supabase.from("teams").select("name").eq("id", profile.team_id).maybeSingle<{ name: string }>()
      : Promise.resolve({ data: null as { name: string } | null }),
    supabase
      .from("recognition_events")
      .select("id, created_at, personal_note, card:card_library(title, category, qr_slug)")
      .eq("receiver_user_id", userId)
      .order("created_at", { ascending: false }),
    supabase.from("recognition_events").select("id", { count: "exact", head: true }).eq("giver_user_id", userId)
  ]);

  const received = (receivedRows ?? []) as ReceivedRecognitionRow[];

  const categoryCounts = new Map<string, number>();
  const qualityCounts = new Map<string, { count: number; category: string }>();

  for (const item of received) {
    const card = Array.isArray(item.card) ? item.card[0] : item.card;
    if (!card) continue;

    const categoryKey = normalizeCategoryKey(card.category);
    categoryCounts.set(categoryKey, (categoryCounts.get(categoryKey) ?? 0) + 1);
    const cardTitle = getLocalizedCardTitle({ title: card.title, slug: card.qr_slug ?? undefined }, locale);
    const existing = qualityCounts.get(cardTitle);
    qualityCounts.set(cardTitle, {
      count: (existing?.count ?? 0) + 1,
      category: categoryKey
    });
  }

  const normalizedRecognitions = received.flatMap((item) => {
    const card = Array.isArray(item.card) ? item.card[0] : item.card;
    if (!card) {
      return [];
    }

    return [
      {
        card: getLocalizedCardTitle({ title: card.title, slug: card.qr_slug ?? undefined }, locale),
        category: getLocalizedCategoryDisplayName(card.category, locale),
        note: item.personal_note ?? t("noPersonalNote"),
        createdAt: item.created_at
      }
    ];
  });

  const topQualityDetails = Array.from(qualityCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([label, info]) => ({
      label,
      count: info.count,
      category: getLocalizedCategoryDisplayName(info.category, locale),
      tone: getEmployeeCategoryColor(info.category)
    }));

  const fourCCategories: CardCategory[] = ["Communication", "Creativity", "Competence", "Collegiality"];
  const categoryBreakdown = fourCCategories
    .map((category) => ({
      label: getLocalizedCategoryDisplayName(category, locale),
      value: categoryCounts.get(category) ?? 0,
      color: getEmployeeCategoryColor(category)
    }))
    .sort((a, b) => b.value - a.value);

  const recent30DaysCount = normalizedRecognitions.filter((recognition) => {
    const createdAt = new Date(recognition.createdAt ?? "");
    return Date.now() - createdAt.getTime() <= 30 * 24 * 60 * 60 * 1000;
  }).length;

  const recentReceivedCards = normalizedRecognitions.slice(0, 8).map((item) => ({
    title: item.card,
    category: item.category,
    receivedAt: item.createdAt ?? "",
    note: item.note && item.note !== t("noPersonalNote") ? item.note : undefined
  }));

  return {
    locale,
    employeeId: userId,
    employeeName: profile ? `${profile.first_name} ${profile.last_name}`.trim() : "",
    teamName: team?.name ?? t("noTeam"),
    cardsReceived: normalizedRecognitions.length,
    cardsGiven: givenCount ?? 0,
    recent30DaysCount,
    recentReceivedCards,
    topQualities: topQualityDetails.map((card) => ({
      label: card.label,
      count: card.count,
      category: card.category,
      tone: card.tone
    })),
    categoryBreakdown,
    recentNotes: normalizedRecognitions
      .slice(0, 8)
      .map((item) => item.note)
      .filter((note): note is string => Boolean(note) && note !== t("noPersonalNote"))
  };
}
