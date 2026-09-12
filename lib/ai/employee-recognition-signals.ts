import { unstable_cache } from "next/cache";
import { callGroqJson } from "@/lib/ai/groq-client";
import { buildEmployeeInsightSystemPrompt } from "@/lib/ai/prompts/employee-insight-prompt";
import { getLocalizedCardDescription, getLocalizedRecognitionSentence } from "@/lib/cards";

export type EmployeeRecognitionSignal = {
  id: string;
  tone: string;
  title: string;
  /** Kept for backward compatibility with the web dashboard's existing render (a flowing
   * narrative combining the sections below); the mobile app renders the structured fields
   * directly instead. */
  detail: string;
  /** Structured sections per the employee-app brief — populated for real Groq-generated
   * insights; the template fallback (limited data / Groq unavailable) only sets headline +
   * compliment, leaving the rest undefined so the UI can skip sections that aren't available. */
  headline?: string;
  compliment?: string;
  strengths?: string;
  behaviorExplanation?: string;
  pattern?: string | null;
  teamContribution?: string;
  suggestion?: string;
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
      detail,
      headline: labels.insightTitle,
      compliment: detail
    }
  ];
}

type GroqInsightResponse = {
  headline?: string;
  compliment?: string;
  strengths?: string;
  behaviorExplanation?: string;
  pattern?: string | null;
  teamContribution?: string;
  suggestion?: string;
};

function buildCardMeaningFields(title: string, locale: string) {
  const cardRef = { title, description: "", recognitionSentence: "" };
  return {
    cardMeaning: getLocalizedCardDescription(cardRef, locale),
    recognitionExample: getLocalizedRecognitionSentence(cardRef, locale)
  };
}

async function generateWithGroq(context: EmployeeSignalsContext): Promise<EmployeeRecognitionSignal[]> {
  const locale = context.locale === "nl" ? "nl" : "en";
  const recentReceivedCards = context.recentReceivedCards.slice(0, 8).map((card) => ({
    ...card,
    ...buildCardMeaningFields(card.title, locale)
  }));
  const topRecognizedCardTitles = context.topQualities.slice(0, 6).map((card) => card.label);
  const recognitionFrequencyByCard = context.topQualities.slice(0, 6).map((card) => ({
    title: card.label,
    category: card.category,
    frequency: card.count,
    ...buildCardMeaningFields(card.label, locale)
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
        content: await buildEmployeeInsightSystemPrompt(locale)
      },
      {
        role: "user",
        content: JSON.stringify(prompt)
      }
    ]
  });

  const headline = parsed.headline?.trim();
  const compliment = parsed.compliment?.trim();
  const strengths = parsed.strengths?.trim();
  const behaviorExplanation = parsed.behaviorExplanation?.trim();
  const pattern = parsed.pattern?.trim() || null;
  const teamContribution = parsed.teamContribution?.trim();
  const suggestion = parsed.suggestion?.trim();

  if (!headline || !compliment || !strengths || !behaviorExplanation || !teamContribution || !suggestion) {
    throw new Error("Groq returned an incomplete structured coaching insight.");
  }

  // Synthesized narrative, kept so the existing web dashboard panel (which renders `detail`
  // as one flowing paragraph) needs no changes — the mobile app renders the sections directly.
  const detail = [compliment, strengths, behaviorExplanation, pattern, teamContribution, suggestion]
    .filter(Boolean)
    .join(" ");

  const primaryCategory = resolvePrimaryCategory(context);

  return [
    {
      id: "employee-ai-coaching-insight",
      tone: toneForCategory(primaryCategory),
      title: "",
      detail,
      headline,
      compliment,
      strengths,
      behaviorExplanation,
      pattern,
      teamContribution,
      suggestion
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
    ["employee-ai-signals", "coaching-v3", buildCacheKey(context)],
    {
      revalidate: 60,
      tags: ["employee-ai-signals", getEmployeeAiSignalsCacheTag(context.employeeId)]
    }
  );

  return cached();
}
