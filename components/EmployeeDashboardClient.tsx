"use client";

import type { CSSProperties } from "react";
import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Gift, Heart, QrCode, Scale, Send } from "lucide-react";
import { acknowledgeReceivedRecognition, approveRecognitionVerification } from "@/app/actions/recognitionVerification";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { MilestoneCard } from "@/components/employee/MilestoneCard";
import { Alert } from "@/components/ui/Alert";
import { BarsChart } from "@/components/ui/BarsChart";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Feed, FeedItem } from "@/components/ui/Feed";
import { Grid } from "@/components/ui/Grid";
import { MeterList } from "@/components/ui/Meter";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { RecognitionList, type RecognitionItem } from "@/components/RecognitionList";
import { EmployeeAiSignalsPanel } from "@/components/EmployeeAiSignalsPanel";
import type { EmployeeSignalsContext } from "@/lib/ai/employee-recognition-signals";
import { getLocalizedCategoryDisplayName, getLocalizedCardTitle, normalizeCategoryKey, type CardCategory } from "@/lib/cards";
import { getRecentMonthLabels } from "@/lib/locale-format";
import { currentUser, employeeCategoryBreakdown, employeeGrowthPoints, employeeTopQualities, recognitions, topQualities } from "@/lib/demo-data";
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

const fourCCategories: CardCategory[] = ["Communication", "Creativity", "Competence", "Collegiality"];

function buildZeroCategoryBreakdown(locale: string): CategoryBreakdown[] {
  const colors = ["var(--theme-sky)", "var(--theme-emerald)", "var(--theme-gold)", "var(--theme-purple-soft)"];
  return fourCCategories.map((category, index) => ({
    label: getLocalizedCategoryDisplayName(category, locale),
    value: 0,
    color: colors[index]
  }));
}

function buildZeroQualityRows(locale: string): QualityPill[] {
  const tones = ["var(--theme-sky)", "var(--theme-emerald)", "var(--theme-gold)", "var(--theme-purple-soft)"];
  return fourCCategories.map((category, index) => ({
    label: getLocalizedCategoryDisplayName(category, locale),
    tone: tones[index],
    count: 0
  }));
}

function buildCategoryDisplayRows(
  breakdown: CategoryBreakdown[],
  locale: string,
  zeroFallback: CategoryBreakdown[]
): CategoryBreakdown[] {
  const valueByCategory = new Map<string, number>();
  const colorByCategory = new Map<string, string>();

  for (const item of breakdown) {
    const key = normalizeCategoryKey(item.label);
    valueByCategory.set(key, item.value);
    colorByCategory.set(key, item.color);
  }

  return fourCCategories
    .map((category, index) => ({
      label: getLocalizedCategoryDisplayName(category, locale),
      value: valueByCategory.get(category) ?? 0,
      color: colorByCategory.get(category) ?? zeroFallback[index]?.color ?? "var(--theme-ink)"
    }))
    .sort((a, b) => b.value - a.value);
}

function localizeDemoTopQualities(locale: string) {
  return employeeTopQualities.map((quality) => ({
    label: getLocalizedCardTitle(quality.label, locale),
    tone: quality.tone,
    count: quality.count
  }));
}

export function EmployeeDashboardClient({ data }: { data?: EmployeeDashboardData }) {
  const locale = useLocale();
  const [storedRecognitions, setStoredRecognitions] = useState<StoredRecognition[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>(data?.pendingApprovals ?? []);
  const [approvalMessage, setApprovalMessage] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isApproving, startApprovalTransition] = useTransition();
  const t = useTranslations("employeeHome");
  const zeroCategoryBreakdown = buildZeroCategoryBreakdown(locale);
  const zeroQualityRows = buildZeroQualityRows(locale);
  const localizedDemoCategories = buildCategoryDisplayRows(employeeCategoryBreakdown, locale, zeroCategoryBreakdown);
  const localizedDemoQualities = localizeDemoTopQualities(locale);
  const demoRecentReceivedCards = recognitions.slice(0, 8).map((recognition) => ({
    title: getLocalizedCardTitle(recognition.card, locale),
    category: getLocalizedCategoryDisplayName(recognition.category, locale),
    receivedAt: recognition.date,
    note: recognition.note
  }));
  const demoSignalsTopQualities = employeeTopQualities.slice(0, 6).map((quality) => {
    const match = topQualities.find((entry) => entry.label === quality.label);
    const categoryKey = normalizeCategoryKey(match?.category ?? "Communication") as CardCategory;
    return {
      label: getLocalizedCardTitle(quality.label, locale),
      count: quality.count,
      category: getLocalizedCategoryDisplayName(categoryKey, locale),
      tone: quality.tone
    };
  });
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
      recentReceivedCards: demoRecentReceivedCards,
      topQualities: demoSignalsTopQualities,
      categoryBreakdown: localizedDemoCategories,
      recentNotes: recognitions.slice(0, 6).map((item) => item.note)
    },
    pendingApprovals: [],
    topQualities: localizedDemoQualities,
    categoryBreakdown: localizedDemoCategories,
    recentRecognitions: recognitions.map((recognition) => ({
      id: recognition.id,
      from: recognition.from,
      to: recognition.to,
      card: getLocalizedCardTitle(recognition.card, locale),
      category: getLocalizedCategoryDisplayName(recognition.category, locale),
      note: recognition.note,
      date: recognition.date
    })),
    growthPoints: employeeGrowthPoints,
    givenGrowthPoints: [1, 0, 2, 1, 2, 1],
    growthLabels: getRecentMonthLabels(6, locale),
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
  const displayCategories =
    resolvedData.categoryBreakdown.length
      ? buildCategoryDisplayRows(resolvedData.categoryBreakdown, locale, zeroCategoryBreakdown)
      : zeroCategoryBreakdown;
  const qualityRows = (resolvedData.topQualities.length ? resolvedData.topQualities.slice(0, 3) : zeroQualityRows.slice(0, 3)).map((quality) => ({
    ...quality,
    label: getLocalizedCardTitle(quality.label, locale)
  }));
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

  const categoryColor: Record<string, string> = {
    Communication: "var(--cat-com)",
    Creativity: "var(--cat-cre)",
    Competence: "var(--cat-cmp)",
    Collegiality: "var(--cat-col)"
  };
  const heroCard = `/landing/cards/${locale === "nl" ? "nl" : "en"}/card_01_cover.png`;

  return (
    <DashboardShell
      role="employee"
      title={t("headerTitle", { name: firstName })}
      subtitle={t("headerSubtitle")}
      user={resolvedData.user}
      actions={
        <>
          <Button href={`/${locale}/employee/scan`} size="sm" icon={<QrCode />}>
            {t("scanCard")}
          </Button>
          <Button href={`/${locale}/cards?intent=give`} variant="ghost" size="sm" icon={<Gift />}>
            {t("giveCard")}
          </Button>
        </>
      }
      unreadNotifications={resolvedData.unreadNotifications ?? 0}
    >
      <MilestoneCard received={resolvedData.cardsReceived} />

      <Grid cols="four">
        <StatCard icon={<Heart />} value={resolvedData.cardsReceived} label={t("received")} helper={t("receivedHelper")} />
        <StatCard icon={<Send />} value={resolvedData.cardsGiven} label={t("given")} helper={t("givenHelper")} />
        <StatCard icon={<Scale />} value={recognitionBalanceValue} label={t("balance")} helper={t("balanceHelper")} />
        <Card size="sm" className="lp-stat">
          <div className="lp-stat-top">
            <span className="lp-stat-label">{t("topThreeQualities")}</span>
          </div>
          <div className="lp-chips" aria-label={t("topThreeAria")}>
            {qualityRows.map((quality) => (
              <span className="lp-chip-q" key={quality.label} style={{ "--c": quality.tone } as CSSProperties}>
                {quality.label}
                <small>{quality.count}</small>
              </span>
            ))}
          </div>
        </Card>
      </Grid>

      {resolvedData.signalsContext ? <EmployeeAiSignalsPanel context={resolvedData.signalsContext} /> : null}

      {pendingApprovals.length ? (
        <Panel
          title={t("verifyTitle")}
          description={t("verifyCopy")}
          action={<span className="lp-pill lp-pill-gold">{t("verifyWaiting", { count: pendingApprovals.length })}</span>}
        >
          <Feed>
            {pendingApprovals.map((approval) => (
              <FeedItem
                key={approval.id}
                title={
                  approval.kind === "receiver_acknowledgement"
                    ? t("gaveYou", { giver: approval.giverName ?? t("aTeammate"), card: approval.cardTitle })
                    : t("saysYouGave", { receiver: approval.receiverName, card: approval.cardTitle })
                }
                tag={approval.category}
                note={approval.note || t("noNote")}
              >
                <div className="lp-feed-actions">
                  <Button size="sm" icon={<CheckCircle2 />} disabled={isApproving && approvingId === approval.id} onClick={() => approveRecognition(approval.id)}>
                    {isApproving && approvingId === approval.id ? t("saving") : approval.kind === "receiver_acknowledgement" ? t("acknowledge") : t("approve")}
                  </Button>
                  <span className="lp-pill lp-pill-gold">{approval.kind === "receiver_acknowledgement" ? t("receiverAcknowledgement") : t("giverVerification")}</span>
                </div>
              </FeedItem>
            ))}
          </Feed>
          {approvalMessage ? (
            <div className="lp-panel-note">
              <Alert tone="info">{approvalMessage}</Alert>
            </div>
          ) : null}
        </Panel>
      ) : null}

      <Grid cols="main">
        <Panel title={t("activityTitle")} description={t("activityCopy")} action={<span className="lp-pill">{t("lastSixMonths")}</span>}>
          <BarsChart
            height={330}
            labels={resolvedData.growthLabels}
            series={[
              { name: t("receivedLabel"), color: "var(--purple)", values: receivedTrendPoints },
              { name: t("givenLabel"), color: "var(--gold)", values: givenTrendPoints }
            ]}
          />
          {!hasActivityItems ? <p className="lp-panel-note">{t("activityEmpty")}</p> : null}
        </Panel>

        <div className="lp-stack">
          <Panel title={t("categoryTitle")} description={t("categoryCopy")}>
            <MeterList
              items={displayCategories.map((item) => ({
                label: item.label,
                value: item.value,
                valueLabel: t("cardsCount", { count: item.value }),
                color: categoryColor[normalizeCategoryKey(item.label)] ?? "var(--purple)"
              }))}
              max={Math.max(...displayCategories.map((item) => item.value), 1)}
            />
            {!hasAnyRecognitionItems ? <p className="lp-panel-note">{t("categoryEmpty")}</p> : null}
          </Panel>

          <Panel
            title={t("qualitiesTitle")}
            description={t("qualitiesCopy")}
            action={<a href={`/${locale}/employee/growth`}>{t("growthInsights")}</a>}
          >
            <MeterList
              items={qualityRows.map((quality) => ({ label: quality.label, value: quality.count, valueLabel: t("cardsCount", { count: quality.count }), color: quality.tone }))}
            />
            {!hasAnyRecognitionItems ? <p className="lp-panel-note">{t("qualitiesEmpty")}</p> : null}
          </Panel>
        </div>
      </Grid>

      <Grid cols="main">
        <Panel title={t("recentTitle")} description={t("recentCopy")} action={<a href={`/${locale}/employee/cards`}>{t("viewAll")}</a>}>
          {hasAnyRecognitionItems ? (
            <RecognitionList items={recognitionItems} compact />
          ) : (
            <EmptyState eyebrow={t("emptyEyebrow")} title={t("emptyTitle")} copy={t("emptyCopy")} actionLabel={t("browseCards")} actionHref={`/${locale}/cards`} />
          )}
        </Panel>

        <Card tone="tint" size="lg" className="lp-cta-tile">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="lp-cta-card" src={heroCard} alt="" />
          <div>
            <h2>{t("ctaTitle")}</h2>
            <p>{t("ctaCopy")}</p>
          </div>
          <div className="lp-stack">
            <Button href={`/${locale}/employee/scan`} icon={<QrCode />} block>
              {t("scanCard")}
            </Button>
            <Button href={`/${locale}/cards?intent=give`} variant="ghost" icon={<Gift />} block>
              {t("giveCard")}
            </Button>
          </div>
        </Card>
      </Grid>
    </DashboardShell>
  );
}
