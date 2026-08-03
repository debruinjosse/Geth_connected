import { unstable_cache } from "next/cache";
import { callGroqJson } from "@/lib/ai/groq-client";
import { buildEmployeeInsightSystemPrompt } from "@/lib/ai/prompts/employee-insight-prompt";

export type EmployeeRecognitionSignal = {
  id: string;
  tone: string;
  title: string;
  detail: string;
  highlights?: Array<{ label: string; category: string; count: number; tone: string }>;
};

export type EmployeeRecentReceivedCard = {
  title: string;
  category: string;
  receivedAt: string;
  note?: string;
};

export type EmployeeSignalsContext = {
  locale: string;
  employeeId: string;
  employeeName: string;
  teamName: string;
  cardsReceived: number;
  cardsGiven: number;
  recent30DaysCount: number;
  recentReceivedCards: EmployeeRecentReceivedCard[];
  topQualities: Array<{ label: string; count: number; category: string; tone: string }>;
  categoryBreakdown: Array<{ label: string; value: number; color: string }>;
  recentNotes: string[];
};

export function getEmployeeAiSignalsCacheTag(employeeId: string) {
  return `employee-ai-signals:${employeeId}`;
}

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

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName.trim();
}

function resolvePrimaryCategory(context: EmployeeSignalsContext) {
  return context.recentReceivedCards[0]?.category ?? context.topQualities[0]?.category ?? "default";
}

function buildTemplateSignals(
  context: EmployeeSignalsContext,
  labels: {
    emptyTitle: string;
    emptyDetail: string;
    insightTitle: string;
    fallbackInsight: string;
    categoryFallbacks: Record<string, string>;
  }
): EmployeeRecognitionSignal[] {
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

  const name = firstName(context.employeeName);
  const primaryCategory = resolvePrimaryCategory(context);
  const fallbackTemplate = labels.categoryFallbacks[primaryCategory] ?? labels.fallbackInsight;
  const detail = fallbackTemplate.replaceAll("{name}", name);

  return [
    {
      id: "employee-ai-coaching-insight",
      tone: toneForCategory(primaryCategory),
      title: labels.insightTitle,
      detail
    }
  ];
}

type GroqInsightResponse = {
  insight?: string;
};

async function generateWithGroq(context: EmployeeSignalsContext): Promise<EmployeeRecognitionSignal[]> {
  const locale = context.locale === "nl" ? "nl" : "en";
  const recentReceivedCards = context.recentReceivedCards.slice(0, 8);
  const topRecognizedCardTitles = context.topQualities.slice(0, 6).map((card) => card.label);
  const recognitionFrequencyByCard = context.topQualities.slice(0, 6).map((card) => ({
    title: card.label,
    category: card.category,
    frequency: card.count
  }));

  const prompt = {
    employeeFirstName: firstName(context.employeeName),
    teamName: context.teamName,
    recentReceivedCards,
    topRecognizedCardTitles,
    recognitionFrequencyByCard,
    recognitionCategories: context.categoryBreakdown.filter((item) => item.value > 0).slice(0, 4),
    recentRecognitionNotes: context.recentNotes.slice(0, 6)
  };

  const parsed = await callGroqJson<GroqInsightResponse>({
    messages: [
      {
        role: "system",
        content: buildEmployeeInsightSystemPrompt(locale)
      },
      {
        role: "user",
        content: JSON.stringify(prompt)
      }
    ]
  });

  const insight = parsed.insight?.trim();
  if (!insight) {
    throw new Error("Groq returned no usable coaching insight.");
  }

  const primaryCategory = resolvePrimaryCategory(context);

  return [
    {
      id: "employee-ai-coaching-insight",
      tone: toneForCategory(primaryCategory),
      title: "",
      detail: insight
    }
  ];
}

function buildCacheKey(context: EmployeeSignalsContext) {
  const digest = [
    context.employeeId,
    context.locale,
    context.cardsReceived,
    context.recent30DaysCount,
    context.recentReceivedCards.map((item) => `${item.title}:${item.category}:${item.receivedAt}`).join("|"),
    context.topQualities.map((item) => `${item.label}:${item.count}`).join("|"),
    context.categoryBreakdown.map((item) => `${item.label}:${item.value}`).join("|"),
    context.recentNotes.join("|")
  ].join(":");

  return digest;
}

export async function getEmployeeRecognitionSignals(
  context: EmployeeSignalsContext,
  labels: {
    emptyTitle: string;
    emptyDetail: string;
    insightTitle: string;
    fallbackInsight: string;
    categoryFallbacks: Record<string, string>;
  }
): Promise<EmployeeRecognitionSignal[]> {
  if (!context.cardsReceived || !context.recentReceivedCards.length) {
    return buildTemplateSignals(context, labels);
  }

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
    ["employee-ai-signals", "coaching-v2", buildCacheKey(context)],
    {
      revalidate: 60,
      tags: ["employee-ai-signals", getEmployeeAiSignalsCacheTag(context.employeeId)]
    }
  );

  return cached();
}
