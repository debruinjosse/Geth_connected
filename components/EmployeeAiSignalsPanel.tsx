"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, RefreshCw } from "lucide-react";
import { fetchEmployeeRecognitionSignals, refreshEmployeeRecognitionSignals } from "@/app/actions/employeeSignals";
import type { EmployeeRecognitionSignal, EmployeeSignalsContext } from "@/lib/ai/employee-recognition-signals";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";

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
          Object.entries(CATEGORY_FALLBACK_KEYS).map(([category, key]) => [category, td(key, { name: "{name}" })])
        );

        const result = await fetchEmployeeRecognitionSignals(context, {
          emptyTitle: td("emptySignalTitle"),
          emptyDetail: td("emptySignalDetail"),
          insightTitle: td("coachingInsightTitle"),
          fallbackInsight: td("coachingFallbackDefault", { name: "{name}" }),
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

  const visibleSignals = signals.filter((signal) => signal.id !== "employee-signal-empty");

  return (
    <Panel
      title={t("signalsTitle")}
      description={t("signalsCopy")}
      action={
        <>
          <span className="lp-pill lp-pill-gold">
            <Sparkles size={14} />
            {loading ? t("signalsGenerating") : hasInsight ? t("signalsReady") : t("signalsWaiting")}
          </span>
          {hasRecognitionData ? (
            <Button variant="ghost" size="sm" icon={<RefreshCw />} onClick={() => void handleRefresh()} disabled={loading || refreshing}>
              {refreshing ? t("signalsRefreshing") : t("refreshInsight")}
            </Button>
          ) : null}
        </>
      }
    >
      {loading ? (
        <div className="lp-stack" style={{ gap: 12 }} aria-live="polite">
          <div className="lp-skel" style={{ width: "92%" }} />
          <div className="lp-skel" style={{ width: "64%" }} />
          <p className="lp-hint">{t("signalsGenerating")}</p>
        </div>
      ) : null}

      {error ? <p className="lp-panel-note">{error}</p> : null}

      {!loading && hasRecognitionData
        ? visibleSignals.map((signal) => (
            <div className="lp-signal" key={signal.id}>
              <Sparkles size={18} aria-hidden="true" />
              <div>
                <p>{signal.detail}</p>
              </div>
            </div>
          ))
        : null}

      {!loading && !hasRecognitionData ? <p className="lp-panel-note" style={{ marginTop: 0 }}>{td("emptySignalDetail")}</p> : null}
    </Panel>
  );
}
