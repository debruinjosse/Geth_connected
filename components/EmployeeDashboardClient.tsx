"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Gift, Heart, QrCode, Scale, Send, Sparkles } from "lucide-react";
import { acknowledgeReceivedRecognition, approveRecognitionVerification } from "@/app/actions/recognitionVerification";
import { BarChart } from "@/components/BarChart";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { RecognitionList, type RecognitionItem } from "@/components/RecognitionList";
import { EmployeeAiSignalsPanel } from "@/components/EmployeeAiSignalsPanel";
import type { EmployeeSignalsContext } from "@/lib/ai/employee-recognition-signals";
import { currentUser, employeeCategoryBreakdown, employeeGrowthPoints, employeeTopQualities, recognitions } from "@/lib/demo-data";
import { getStoredRecognitions, type StoredRecognition } from "@/lib/demo-session";

type QualityPill = {
  label: string;
  tone: string;
  count: number;
};

type CategoryBreakdown = {
  label: string;
  value: number;
  color: string;
};

type DashboardUser = {
  name: string;
  initials: string;
  team: string;
  imageUrl?: string | null;
};

type PendingApproval = {
  id: string;
  kind: "giver_verification" | "receiver_acknowledgement";
  receiverName: string;
  giverName?: string;
  cardTitle: string;
  category: string;
  note: string | null;
  createdAt: string;
};

type EmployeeDashboardData = {
  mode: "demo" | "supabase";
  user: DashboardUser;
  title: string;
  subtitle: string;
  actionsLabel: string;
  cardsReceived: number;
  cardsGiven: number;
  energyScore: number;
  quartersActive: number;
  topQualitiesCount: number;
  topStrengthLabel?: string;
  signalsContext?: EmployeeSignalsContext;
  pendingApprovals?: PendingApproval[];
  topQualities: QualityPill[];
  categoryBreakdown: CategoryBreakdown[];
  recentRecognitions: RecognitionItem[];
  growthPoints: number[];
  givenGrowthPoints: number[];
  growthLabels: string[];
  unreadNotifications?: number;
};

const zeroCategoryBreakdown: CategoryBreakdown[] = [
  { label: "Communication", value: 0, color: "var(--theme-sky)" },
  { label: "Creativity", value: 0, color: "var(--theme-emerald)" },
  { label: "Competence", value: 0, color: "var(--theme-gold)" },
  { label: "Collegiality", value: 0, color: "var(--theme-purple-soft)" }
];

const zeroQualityRows: QualityPill[] = [
  { label: "Communication", tone: "var(--theme-sky)", count: 0 },
  { label: "Creativity", tone: "var(--theme-emerald)", count: 0 },
  { label: "Competence", tone: "var(--theme-gold)", count: 0 },
  { label: "Collegiality", tone: "var(--theme-purple-soft)", count: 0 }
];

export function EmployeeDashboardClient({ data }: { data?: EmployeeDashboardData }) {
  const locale = useLocale();
  const [storedRecognitions, setStoredRecognitions] = useState<StoredRecognition[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>(data?.pendingApprovals ?? []);
  const [approvalMessage, setApprovalMessage] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isApproving, startApprovalTransition] = useTransition();
  const t = useTranslations("employeeHome");
  const resolvedData = data ?? {
    mode: "demo" as const,
    user: currentUser,
    title: t("demoTitle"),
    subtitle: t("demoSubtitle"),
    actionsLabel: t("demoQuarter"),
    cardsReceived: 15,
    cardsGiven: 7,
    energyScore: 78,
    quartersActive: 3,
    topQualitiesCount: 11,
    topStrengthLabel: t("demoStrength"),
    signalsContext: {
      locale,
      employeeId: "demo-employee",
      employeeName: currentUser.name,
      teamName: currentUser.team,
      cardsReceived: 15,
      cardsGiven: 7,
      recent30DaysCount: 4,
      topQualities: employeeTopQualities.map((quality) => ({
        label: quality.label,
        count: quality.count,
        category: quality.label,
        tone: quality.tone
      })),
      categoryBreakdown: employeeCategoryBreakdown,
      recentNotes: recognitions.slice(0, 6).map((item) => item.note)
    },
    pendingApprovals: [],
    topQualities: employeeTopQualities,
    categoryBreakdown: employeeCategoryBreakdown,
    recentRecognitions: recognitions.map((recognition) => ({
      id: recognition.id,
      from: recognition.from,
      to: recognition.to,
      card: recognition.card,
      category: recognition.category,
      note: recognition.note,
      date: recognition.date
    })),
    growthPoints: employeeGrowthPoints,
    givenGrowthPoints: [1, 0, 2, 1, 2, 1],
    growthLabels: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    unreadNotifications: 0
  };
  useEffect(() => {
    if (resolvedData.mode === "demo") {
      setStoredRecognitions(getStoredRecognitions());
    }
  }, [resolvedData.mode]);

  useEffect(() => {
    setPendingApprovals(data?.pendingApprovals ?? []);
  }, [data?.pendingApprovals]);

  const recognitionItems = resolvedData.mode === "demo" ? [...storedRecognitions, ...resolvedData.recentRecognitions] : resolvedData.recentRecognitions;
  const hasAnyRecognitionItems = recognitionItems.length > 0;
  const firstName = resolvedData.user.name?.split(" ")[0] || "there";
  const displayCategories = [...(resolvedData.categoryBreakdown.length ? resolvedData.categoryBreakdown : zeroCategoryBreakdown)].sort((a, b) => b.value - a.value);
  const qualityRows = resolvedData.topQualities.length ? resolvedData.topQualities.slice(0, 3) : zeroQualityRows.slice(0, 3);
  const recognitionBalanceValue = `${resolvedData.cardsReceived} / ${resolvedData.cardsGiven}`;
  const receivedTrendPoints = resolvedData.growthPoints.length ? resolvedData.growthPoints : [0, 0, 0, 0, 0, 0];
  const givenTrendPoints = resolvedData.givenGrowthPoints.length ? resolvedData.givenGrowthPoints : [0, 0, 0, 0, 0, 0];
  const activityMax = Math.max(...receivedTrendPoints, ...givenTrendPoints, 1);
  const receivedActivityTotal = receivedTrendPoints.reduce((sum, value) => sum + value, 0);
  const givenActivityTotal = givenTrendPoints.reduce((sum, value) => sum + value, 0);
  const hasActivityItems = receivedActivityTotal + givenActivityTotal > 0;

  function approveRecognition(recognitionId: string) {
    setApprovingId(recognitionId);
    setApprovalMessage("");

    startApprovalTransition(async () => {
      const approval = pendingApprovals.find((item) => item.id === recognitionId);
      const result =
        approval?.kind === "receiver_acknowledgement"
          ? await acknowledgeReceivedRecognition(recognitionId)
          : await approveRecognitionVerification(recognitionId);
      setApprovalMessage(result.message);

      if (result.ok) {
        setPendingApprovals((current) => current.filter((approval) => approval.id !== recognitionId));
      }

      setApprovingId(null);
    });
  }

  return (
    <DashboardShell
      role="employee"
      title={t("headerTitle", { name: firstName })}
      subtitle={t("headerSubtitle")}
      user={resolvedData.user}
      actions={
        <>
          <Link className="btn btn-primary compact" href={`/${locale}/employee/scan`}><QrCode size={16} /> {t("scanCard")}</Link>
          <Link className="btn btn-dark compact" href={`/${locale}/cards?intent=give`}><Gift size={16} /> {t("giveCard")}</Link>
        </>
      }
      unreadNotifications={resolvedData.unreadNotifications ?? 0}
    >
      <div className="employee-dashboard">
        <section className="compact-metrics-grid">
          <MetricCard icon={<Heart />} value={resolvedData.cardsReceived} label={t("received")} helper={t("receivedHelper")} />
          <MetricCard icon={<Send />} value={resolvedData.cardsGiven} label={t("given")} helper={t("givenHelper")} />
          <MetricCard icon={<Scale />} value={recognitionBalanceValue} label={t("balance")} helper={t("balanceHelper")} tone="var(--theme-gold)" iconBackground="rgba(216, 162, 58, 0.12)" />
          <article className="metric-card top-qualities-card">
            <div>
              <span className="top-qualities-card-label">{t("topThreeQualities")}</span>
              <div className="top-quality-buttons" aria-label={t("topThreeAria")}>
                {qualityRows.map((quality) => (
                  <span className="top-quality-button" key={quality.label} style={{ "--quality-tone": quality.tone } as CSSProperties}>
                    <strong>{quality.label}</strong>
                    <small>{t("cardsCount", { count: quality.count })}</small>
                  </span>
                ))}
              </div>
            </div>
          </article>
        </section>

        {resolvedData.signalsContext ? <EmployeeAiSignalsPanel context={resolvedData.signalsContext} /> : null}

        {pendingApprovals.length ? (
          <article className="panel dashboard-panel approval-panel">
            <div className="panel-top">
              <div>
                <h2>{t("verifyTitle")}</h2>
                <p>{t("verifyCopy")}</p>
              </div>
              <span className="quality-pill">{t("verifyWaiting", { count: pendingApprovals.length })}</span>
            </div>
            <div className="approval-list">
              {pendingApprovals.map((approval) => (
                <div className="approval-card" key={approval.id}>
                  <div>
                    <span className="approval-eyebrow">{approval.kind === "receiver_acknowledgement" ? t("receiverAcknowledgement") : t("giverVerification")}</span>
                    <strong>
                      {approval.kind === "receiver_acknowledgement"
                        ? t("gaveYou", { giver: approval.giverName ?? t("aTeammate"), card: approval.cardTitle })
                        : t("saysYouGave", { receiver: approval.receiverName, card: approval.cardTitle })}
                    </strong>
                    <p>{approval.note || t("noNote")}</p>
                    <span className="quality-pill">{approval.category}</span>
                  </div>
                  <button className="btn btn-primary compact" type="button" disabled={isApproving && approvingId === approval.id} onClick={() => approveRecognition(approval.id)}>
                    <CheckCircle2 size={16} />
                    {isApproving && approvingId === approval.id ? t("saving") : approval.kind === "receiver_acknowledgement" ? t("acknowledge") : t("approve")}
                  </button>
                </div>
              ))}
            </div>
            {approvalMessage ? <p className="section-copy" aria-live="polite">{approvalMessage}</p> : null}
          </article>
        ) : null}

        <section className="employee-analytics-grid">
          <article className="panel dashboard-panel trend-panel">
            <div className="panel-top">
              <div>
                <h2>{t("activityTitle")}</h2>
                <p>{t("activityCopy")}</p>
              </div>
              <span className="quality-pill">{t("lastSixMonths")}</span>
            </div>
            <div className="recognition-activity-summary" aria-label={t("activityTotalsAria")}>
              <span className="activity-total-chip received">{t("receivedLabel")} <strong>{receivedActivityTotal}</strong></span>
              <span className="activity-total-chip given">{t("givenLabel")} <strong>{givenActivityTotal}</strong></span>
            </div>
            <div className="recognition-activity-compare" aria-label={t("activityByMonthAria")}>
              {resolvedData.growthLabels.map((label, index) => {
                const receivedValue = receivedTrendPoints[index] ?? 0;
                const givenValue = givenTrendPoints[index] ?? 0;
                const receivedWidth = receivedValue > 0 ? Math.max(8, Math.round((receivedValue / activityMax) * 100)) : 0;
                const givenWidth = givenValue > 0 ? Math.max(8, Math.round((givenValue / activityMax) * 100)) : 0;

                return (
                  <div className="recognition-activity-row" key={label}>
                    <span className="activity-month">{label}</span>
                    <div className="activity-lines">
                      <div className="activity-line received">
                        <span>{t("receivedLabel")}</span>
                        <div className="activity-track">
                          <i style={{ width: `${receivedWidth}%` }} />
                        </div>
                        <strong>{receivedValue}</strong>
                      </div>
                      <div className="activity-line given">
                        <span>{t("givenLabel")}</span>
                        <div className="activity-track">
                          <i style={{ width: `${givenWidth}%` }} />
                        </div>
                        <strong>{givenValue}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!hasActivityItems ? <p className="section-copy">{t("activityEmpty")}</p> : null}
          </article>

          <article className="panel dashboard-panel category-panel">
            <div className="panel-top">
              <div>
                <h2>{t("categoryTitle")}</h2>
                <p>{t("categoryCopy")}</p>
              </div>
            </div>
            <BarChart
              compact
              items={displayCategories.map((item) => ({
                label: item.label,
                value: item.value,
                valueLabel: t("cardsCount", { count: item.value }),
                color: item.color
              }))}
            />
            {!hasAnyRecognitionItems ? <p className="section-copy">{t("categoryEmpty")}</p> : null}
          </article>

          <article className="panel dashboard-panel qualities-panel">
            <div className="panel-top">
              <div>
                <h2>{t("qualitiesTitle")}</h2>
                <p>{t("qualitiesCopy")}</p>
              </div>
            </div>
            <div className="quality-count-list">
              {qualityRows.map((quality) => (
                <div className="quality-count-row" key={quality.label}>
                  <span>{quality.label}</span>
                  <strong>{t("cardsCount", { count: quality.count })}</strong>
                </div>
              ))}
            </div>
            <Link className="panel-link" href={`/${locale}/employee/growth`}>{t("growthInsights")} <ArrowRight size={14} /></Link>
            {!hasAnyRecognitionItems ? <p className="section-copy">{t("qualitiesEmpty")}</p> : null}
          </article>
        </section>

        <section className="employee-lower-grid">
          <article className="panel dashboard-panel recent-recognition-panel">
            <div className="panel-top">
              <div>
                <h2>{t("recentTitle")}</h2>
                <p>{t("recentCopy")}</p>
              </div>
              <Link href={`/${locale}/employee/cards`}>{t("viewAll")}</Link>
            </div>
            {hasAnyRecognitionItems ? (
              <RecognitionList items={recognitionItems} compact />
            ) : (
              <EmptyState
                eyebrow={t("emptyEyebrow")}
                title={t("emptyTitle")}
                copy={t("emptyCopy")}
                actionLabel={t("browseCards")}
                actionHref={`/${locale}/cards`}
              />
            )}
          </article>

          <article className="employee-cta-panel">
            <div className="cta-orbit">
              <Sparkles size={22} />
            </div>
            <div>
              <h2>{t("ctaTitle")}</h2>
              <p>{t("ctaCopy")}</p>
            </div>
            <Link className="btn btn-dark" href={`/${locale}/employee/scan`}>
              {t("scanCard")} <QrCode size={16} />
            </Link>
            <Link className="btn btn-secondary" href={`/${locale}/cards?intent=give`}>
              {t("giveCard")} <Gift size={16} />
            </Link>
          </article>
        </section>
      </div>
    </DashboardShell>
  );
}
