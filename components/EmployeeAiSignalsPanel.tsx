"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, RefreshCw } from "lucide-react";
import { fetchEmployeeRecognitionSignals, refreshEmployeeRecognitionSignals } from "@/app/actions/employeeSignals";
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
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const hasRecognitionData = context.cardsReceived > 0 && context.recentReceivedCards.length > 0;

  const contextKey = [
    context.employeeId,
    context.locale,
    context.cardsReceived,
    context.recent30DaysCount,
    context.recentReceivedCards.map((item) => `${item.title}:${item.category}:${item.receivedAt}`).join("|"),
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
  }, [contextKey, refreshNonce, t, td]);

  async function handleRefresh() {
    if (!hasRecognitionData || refreshing) {
      return;
    }

    setRefreshing(true);
    setError("");

    try {
      await refreshEmployeeRecognitionSignals(context.employeeId);
      setRefreshNonce((current) => current + 1);
    } catch {
      setError(t("signalsLoadError"));
    } finally {
      setRefreshing(false);
    }
  }

  const hasInsight =
    hasRecognitionData &&
    !loading &&
    signals.some((signal) => signal.id !== "employee-signal-empty" && signal.detail.trim());

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
        {hasRecognitionData ? (
          <button
            className="btn btn-secondary employee-ai-refresh-button"
            type="button"
            onClick={() => void handleRefresh()}
            disabled={loading || refreshing}
          >
            <RefreshCw size={14} />
            {refreshing ? t("signalsRefreshing") : t("refreshInsight")}
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="employee-ai-signals-loading" aria-live="polite">
          <div className="employee-ai-signals-skeleton" />
          <div className="employee-ai-signals-skeleton short" />
          <p>{t("signalsGenerating")}</p>
        </div>
      ) : null}

      {error ? <p className="section-copy">{error}</p> : null}

      {!loading && hasRecognitionData && signals.some((signal) => signal.id !== "employee-signal-empty") ? (
        <SignalList items={signals.filter((signal) => signal.id !== "employee-signal-empty")} variant="coaching" />
      ) : null}

      {!loading && !hasRecognitionData ? <p className="section-copy">{td("emptySignalDetail")}</p> : null}
    </article>
  );
}
