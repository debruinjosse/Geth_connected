"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { fetchEmployeeRecognitionSignals } from "@/app/actions/employeeSignals";
import type { EmployeeRecognitionSignal, EmployeeSignalsContext } from "@/lib/ai/employee-recognition-signals";
import { SignalList } from "@/components/SignalList";

export function EmployeeAiSignalsPanel({ context }: { context: EmployeeSignalsContext }) {
  const t = useTranslations("employeeHome");
  const tc = useTranslations("common");
  const [signals, setSignals] = useState<EmployeeRecognitionSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const contextKey = [
    context.employeeId,
    context.locale,
    context.cardsReceived,
    context.cardsGiven,
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
        const personaKeys = getPersonaKeys(context.topQualities[0]?.category ?? "");
        const result = await fetchEmployeeRecognitionSignals(context, {
          emptyTitle: t("emptySignalTitle"),
          emptyDetail: t("emptySignalDetail"),
          personaTitle: t(personaKeys.title),
          personaStory: t(personaKeys.story),
          storyEvidence: t("storyEvidence"),
          paceConsistent: t("paceConsistent"),
          paceGrowing: t("paceGrowing"),
          cardWordSingular: tc("card"),
          cardWordPlural: tc("cards")
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
  }, [contextKey, t, tc]);

  return (
    <article className="panel dashboard-panel employee-ai-signals-panel">
      <div className="panel-top">
        <div>
          <h2>{t("signalsTitle")}</h2>
          <p>{t("signalsCopy")}</p>
        </div>
        <span className="quality-pill">
          <Sparkles size={14} />
          {loading ? t("signalsGenerating") : t("signalsActive", { count: signals.length })}
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

      {!loading && signals.length ? <SignalList items={signals} /> : null}
    </article>
  );
}

function getPersonaKeys(category: string) {
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
