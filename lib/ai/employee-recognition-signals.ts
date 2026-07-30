import { unstable_cache } from "next/cache";
import { callGroqJson } from "@/lib/ai/groq-client";

export type EmployeeRecognitionSignal = {
  id: string;
  tone: string;
  title: string;
  detail: string;
  highlights?: Array<{ label: string; category: string; count: number; tone: string }>;
};

export type EmployeeSignalsContext = {
  locale: string;
  employeeId: string;
  employeeName: string;
  teamName: string;
  cardsReceived: number;
  cardsGiven: number;
  recent30DaysCount: number;
  topQualities: Array<{ label: string; count: number; category: string; tone: string }>;
  categoryBreakdown: Array<{ label: string; value: number; color: string }>;
  recentNotes: string[];
};

function toneForCategory(category: string) {
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
      return "var(--theme-gold)";
  }
}

function buildTemplateSignals(
  context: EmployeeSignalsContext,
  labels: {
    emptyTitle: string;
    emptyDetail: string;
    personaTitle: string;
    personaStory: string;
    storyEvidence: string;
    paceConsistent: string;
    paceGrowing: string;
    cardWord: (count: number) => string;
  }
): EmployeeRecognitionSignal[] {
  const topThree = context.topQualities.slice(0, 3);

  if (!context.cardsReceived) {
    return [
      {
        id: "employee-signal-empty",
        tone: "var(--theme-gold)",
        title: labels.emptyTitle,
        detail: labels.emptyDetail
      }
    ];
  }

  const evidence = topThree
    .map((card) => `${card.label} (${card.category}, ${card.count} ${labels.cardWord(card.count)})`)
    .join(", ");

  return [
    {
      id: "employee-ai-recognition-story",
      tone: topThree[0]?.tone ?? "var(--theme-gold)",
      title: labels.personaTitle,
      detail: labels.storyEvidence
        .replace("{story}", labels.personaStory)
        .replace("{evidence}", evidence)
        .replace("{pace}", context.recent30DaysCount >= 5 ? labels.paceConsistent : labels.paceGrowing),
      highlights: topThree.map((card) => ({
        label: card.label,
        category: card.category,
        count: card.count,
        tone: card.tone
      }))
    }
  ];
}

type GroqSignalsResponse = {
  signals?: Array<{
    title?: string;
    detail?: string;
    category?: string;
    highlights?: Array<{ label?: string; category?: string; count?: number }>;
  }>;
};

async function generateWithGroq(context: EmployeeSignalsContext): Promise<EmployeeRecognitionSignal[]> {
  const localeLabel = context.locale === "nl" ? "Dutch" : "English";
  const topCards = context.topQualities.slice(0, 5);
  const categories = context.categoryBreakdown.filter((item) => item.value > 0).slice(0, 4);
  const noteSamples = context.recentNotes.slice(0, 6);

  const prompt = {
    employeeName: context.employeeName,
    teamName: context.teamName,
    cardsReceived: context.cardsReceived,
    cardsGiven: context.cardsGiven,
    recognitionsLast30Days: context.recent30DaysCount,
    topRecognizedCards: topCards,
    categoryBreakdown: categories,
    noteSamples
  };

  const parsed = await callGroqJson<GroqSignalsResponse>({
    messages: [
      {
        role: "system",
        content: [
          `You are GETH, a workplace recognition coach. Write in ${localeLabel}.`,
          "Return JSON only: {\"signals\":[{\"title\":\"...\",\"detail\":\"...\",\"category\":\"Communication|Creativity|Competence|Collegiality|Growth|Balance\",\"highlights\":[{\"label\":\"card title\",\"category\":\"4C category\",\"count\":number}]}]}",
          "Create 2 or 3 concise recognition signals for this employee based ONLY on the provided data.",
          "Each title: max 12 words. Each detail: 2 short sentences, warm and specific, no fluff.",
          "Mention real card titles and categories from the data when possible.",
          "Do not invent recognitions that are not supported by the numbers.",
          "If cardsReceived is 0, return one encouraging signal about starting recognition."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify(prompt)
      }
    ]
  });

  const rawSignals = parsed.signals?.filter((signal) => signal.title?.trim() && signal.detail?.trim()) ?? [];
  if (!rawSignals.length) {
    throw new Error("Groq returned no usable signals.");
  }

  return rawSignals.slice(0, 3).map((signal, index) => {
    const category = signal.category ?? topCards[index]?.category ?? "Growth";
    const highlights =
      signal.highlights
        ?.filter((item) => item.label && item.category && typeof item.count === "number")
        .slice(0, 3)
        .map((item) => ({
          label: item.label!,
          category: item.category!,
          count: item.count!,
          tone: toneForCategory(item.category!)
        })) ?? undefined;

    return {
      id: `employee-ai-signal-${index + 1}`,
      tone: toneForCategory(category),
      title: signal.title!.trim(),
      detail: signal.detail!.trim(),
      highlights:
        highlights?.length
          ? highlights
          : topCards.slice(0, 3).map((card) => ({
              label: card.label,
              category: card.category,
              count: card.count,
              tone: card.tone
            }))
    };
  });
}

function buildCacheKey(context: EmployeeSignalsContext) {
  const digest = [
    context.employeeId,
    context.locale,
    context.cardsReceived,
    context.cardsGiven,
    context.recent30DaysCount,
    context.topQualities.map((item) => `${item.label}:${item.count}`).join("|"),
    context.categoryBreakdown.map((item) => `${item.label}:${item.value}`).join("|")
  ].join(":");

  return digest;
}

export async function getEmployeeRecognitionSignals(
  context: EmployeeSignalsContext,
  labels: {
    emptyTitle: string;
    emptyDetail: string;
    personaTitle: string;
    personaStory: string;
    storyEvidence: string;
    paceConsistent: string;
    paceGrowing: string;
    cardWord: (count: number) => string;
  }
): Promise<EmployeeRecognitionSignal[]> {
  const templateFallback = () => buildTemplateSignals(context, labels);

  if (!process.env.GROQ_API_KEY?.trim()) {
    return templateFallback();
  }

  const cached = unstable_cache(
    async () => {
      try {
        return await generateWithGroq(context);
      } catch (error) {
        console.warn("Employee AI signals fallback:", error instanceof Error ? error.message : error);
        return templateFallback();
      }
    },
    ["employee-ai-signals", buildCacheKey(context)],
    { revalidate: 600 }
  );

  return cached();
}
