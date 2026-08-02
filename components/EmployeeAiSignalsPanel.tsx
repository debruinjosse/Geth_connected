"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { fetchEmployeeRecognitionSignals } from "@/app/actions/employeeSignals";
import type { EmployeeRecognitionSignal, EmployeeSignalsContext } from "@/lib/ai/employee-recognition-signals";
import { SignalList } from "@/components/SignalList";

const CATEGORY_FALLBACK_KEYS = {
  Communication: "coachingFallbackCommunication",
  Communicatie: "coachingFallbackCommunication",
  Creativity: "coachingFallbackCreativity",
  Creativiteit: "coachingFallbackCreativity",
  Competence: "coachingFallbackCompetence",
  Competentie: "coachingFallbackCompetence",
  Collegiality: "coachingFallbackCollegiality",
  Collegialiteit: "coachingFallbackCollegiality",
  default: "coachingFallbackDefault"
} as const;

export function EmployeeAiSignalsPanel({ context }: { context: EmployeeSignalsContext }) {
  const t = useTranslations("employeeHome");
  const td = useTranslations("employeeDashboard");
  const [signals, setSignals] = useState<EmployeeRecognitionSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const contextKey = [
    context.employeeId,
    context.locale,
    context.cardsReceived,
    context.recent30DaysCount,
    context.topQualities.map((item) => `${item.label}:${item.count}`).join("|"),
    context.categoryBreakdown.map((item) => `${item.label}:${item.value}`).join("|"),
    context.recentNotes.join("|")
  ].join(":");

  useEffect(() => {
    let cancelled = false;

    async function loadSignals() {
      setLoading(true);
      setError("");

      try {
        const categoryFallbacks = Object.fromEntries(
          Object.entries(CATEGORY_FALLBACK_KEYS).map(([category, key]) => [category, td(key)])
        );

        const result = await fetchEmployeeRecognitionSignals(context, {
          emptyTitle: td("emptySignalTitle"),
          emptyDetail: td("emptySignalDetail"),
          insightTitle: td("coachingInsightTitle"),
          fallbackInsight: td("coachingFallbackDefault"),
          categoryFallbacks
        });

        if (!cancelled) {
          setSignals(result);
        }
      } catch {
        if (!cancelled) {
          setError(t("signalsLoadError"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSignals();

    return () => {
      cancelled = true;
    };
  }, [contextKey, t, td]);

  const hasInsight = !loading && signals.some((signal) => signal.detail.trim());

  return (
    <article className="panel dashboard-panel employee-ai-signals-panel">
      <div className="panel-top">
        <div>
          <h2>{t("signalsTitle")}</h2>
          <p>{t("signalsCopy")}</p>
        </div>
        <span className="quality-pill">
          <Sparkles size={14} />
          {loading ? t("signalsGenerating") : hasInsight ? t("signalsReady") : t("signalsWaiting")}
        </span>
      </div>

      {loading ? (
        <div className="employee-ai-signals-loading" aria-live="polite">
          <div className="employee-ai-signals-skeleton" />
          <div className="employee-ai-signals-skeleton short" />
          <p>{t("signalsGenerating")}</p>
        </div>
      ) : null}

      {error ? <p className="section-copy">{error}</p> : null}

      {!loading && signals.length ? <SignalList items={signals} variant="coaching" /> : null}
    </article>
  );
}
